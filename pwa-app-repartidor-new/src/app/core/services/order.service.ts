import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpService } from './http.service';
import { SocketService } from './socket.service';
import { StorageService } from './storage.service';
import { GeolocationService } from './geolocation.service';
import { AuthService } from './auth.service';
import { GeoUtils } from '../utils/geo-utils';
import { toObservable } from '@angular/core/rxjs-interop';
import { lastValueFrom } from 'rxjs';
import { TimeLinePedido, createDefaultTimeLine } from '../models/time-line-pedido.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    orders = signal<any[]>([]);
    currentOrder = computed(() => this.orders()[0] || null);

    // State for tracking delivery progress
    // 0: Pending, 1: Accepted, 2: Arrived at Commerce, 3: On the way, 4: Delivered
    deliveryStep = signal<number>(0);

    constructor(
        private http: HttpService,
        private socket: SocketService,
        private storage: StorageService,
        private geo: GeolocationService,
        private auth: AuthService
    ) {
        this.init();

        // React to position changes to check proximity and notify location
        // Use setTimeout to avoid signal write errors
        effect(() => {
            const pos = this.geo.currentPosition();
            const order = this.currentOrder();
            if (pos && order) {
                // Use setTimeout to break out of change detection cycle
                setTimeout(() => {
                    this.checkProximity(pos, order);
                    this.notifyLocationToSocket(pos, order);
                }, 0);
            }
        });
    }

    private async init() {
        // Load orders on app start from localStorage
        await this.loadOrders();

        // Listen for pending orders response from socket
        this.socket.listen('repartidor-get-pedido-pendiente-aceptar').subscribe(async (response: any) => {
            let dataToProcess = null;

            // Handle both array and object responses
            if (Array.isArray(response) && response.length > 0) {
                dataToProcess = response[0];
            } else if (response && typeof response === 'object' && !Array.isArray(response)) {
                dataToProcess = response;
            }

            if (dataToProcess && dataToProcess.pedido_por_aceptar) {
                // Save to localStorage
                await this.setPedidosPorAceptar(dataToProcess.pedido_por_aceptar);
                // Reload orders
                await this.loadOrders();
            }
        });

        // Listen for new orders via socket
        this.socket.listen('repartidor-nuevo-pedido').subscribe((order: any) => {
            // Play notification sound
            this.playAudioNewPedido();

            // Refresh pending orders list from server
            const user = this.auth.currentUser();

            if (user?.usuario?.idrepartidor) {
                this.socket.emit('repartidor-get-pedido-pendiente-aceptar', {
                    idrepartidor: user.usuario.idrepartidor,
                    online: 1
                });
            } else {
                console.error('Cannot refresh orders: User not logged in or missing idrepartidor', user);
            }
        });

        // Listen for removed orders
        this.socket.listen('repartidor-notifica-evento-removido-pedido').subscribe(async (data: any) => {
            // Reload orders to update the list
            await this.loadOrders();
        });

        // Listen for removed orders (Server notification - Time expired or reassigned)
        this.socket.listen('repartidor-notifica-server-removido-pedido').subscribe((data: any) => {
            // Refresh pending orders list from server to reflect removal
            const user = this.auth.currentUser();
            if (user?.usuario?.idrepartidor) {
                this.socket.emit('repartidor-get-pedido-pendiente-aceptar', {
                    idrepartidor: user.usuario.idrepartidor,
                    online: 1
                });
            }
        });

        // Listen for order removal (Server notification)
        // Data is null because there's only one order at a time
        this.socket.listen('repartidor-notifica-server-quita-pedido').subscribe(async (data: any) => {
            // Clear the single order immediately
            this.orders.set([]);
            await this.storage.set('sys::pr::it', []);
        });
    }

    async loadOrders() {
        try {
            // Step 1: Get pending orders from localStorage (sys::pXa)
            const pedidosPorAceptar = await this.getPedidosPorAceptar();

            if (!pedidosPorAceptar || !pedidosPorAceptar.pedidos || pedidosPorAceptar.pedidos.length === 0) {
                this.orders.set([]);
                return;
            }

            // Step 2: Fetch full order details from API
            const ids = pedidosPorAceptar.pedidos.join(',');
            const response: any = await lastValueFrom(
                this.http.post('repartidor/get-pedidos-recibidos-group', { ids })
            );

            if (!response || !response.data) {
                console.error('No data received from get-pedidos-recibidos-group');
                this.orders.set([]);
                return;
            }

            // Step 3: Format orders (parse JSON, calculate amounts)
            const formattedOrders = response.data.map((order: any) => {
                try {
                    // Robust JSON Parsing
                    if (typeof order.json_datos_delivery === 'string') {
                        try {
                            order.json_datos_delivery = JSON.parse(order.json_datos_delivery);
                            // Some environments might double serialize
                            if (typeof order.json_datos_delivery === 'string') {
                                order.json_datos_delivery = JSON.parse(order.json_datos_delivery);
                            }
                        } catch (e) {
                            console.error(`Error parsing json_datos_delivery for order #${order.idpedido}:`, e);
                        }
                    }

                    // Robust Delivery Data extraction
                    const deliveryData = order.json_datos_delivery?.p_header?.arrDatosDelivery
                        || order.json_datos_delivery?.arrDatosDelivery
                        || order.json_datos_delivery
                        || {};

                    // Calculate amounts with safe fallbacks
                    const importeTotal = parseFloat(deliveryData?.importeTotal || order.total_r || '0');
                    const costoDelivery = parseFloat(deliveryData?.costoTotalDelivery || '0');
                    const propina = parseFloat(deliveryData?.propina?.value || '0');

                    // Amount to collect from commerce
                    order.importe_pagar_comercio = Math.max(0, importeTotal - costoDelivery);
                    // If payment method is card (2), commerce pays 0
                    if (deliveryData?.metodoPago?.idtipo_pago === 2) {
                        order.importe_pagar_comercio = 0;
                    }

                    // Map status
                    // Ensure pwa_delivery_status is available. Default to 0 if missing.
                    order.pwa_delivery_status = order.pwa_delivery_status !== undefined ? parseInt(order.pwa_delivery_status) : 0;

                    // Total commission + tip for delivery person
                    order.comision_entrega_total = costoDelivery + propina;

                    // Total to collect from customer
                    order.importe_pagar = pedidosPorAceptar.importe_pagar || importeTotal;

                    // Initialize time_line if not exists
                    if (!order.time_line) {
                        order.time_line = createDefaultTimeLine();

                        // Notify client via socket about initial timeline state
                        this.socket.emit('repartidor-notifica-cliente-time-line-one', {
                            idpedido: order.idpedido,
                            time_line: order.time_line
                        });
                    }

                    return order;
                } catch (error) {
                    console.error('Error formatting order:', order.idpedido, error);
                    return null;
                }
            }).filter((order: any) => order !== null);

            // Step 4: Update signal
            this.orders.set(formattedOrders);

            // Step 5: Save to storage for offline access
            await this.storage.set('sys::pr::it', formattedOrders);

        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders.set([]);
        }
    }

    // PUBLIC METHODS - Can be accessed from components
    async getPedidosPorAceptar(): Promise<any> {
        const data = await this.storage.get('sys::pXa');
        if (!data) return null;

        try {
            // Data is base64 encoded in old project
            return JSON.parse(atob(data));
        } catch {
            // If not base64, try parsing directly
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
    }

    async setPedidosPorAceptar(pedidosData: any): Promise<void> {
        try {
            // Store as base64 (matching old project)
            const encoded = btoa(JSON.stringify(pedidosData));
            await this.storage.set('sys::pXa', encoded);
        } catch (error) {
            console.error('Error saving pedidos por aceptar:', error);
        }
    }

    /**
     * Request pending orders from server via socket
     * Solo solicita pedidos si el repartidor está online
     */
    emitRequestPendingOrders() {
        const user = this.auth.currentUser();

        // Verificar que el usuario esté autenticado
        if (!user?.usuario?.idrepartidor) {
            return;
        }

        // Verificar que el repartidor esté online
        if (!this.auth.isOnline()) {
            return;
        }

        this.socket.emit('repartidor-get-pedido-pendiente-aceptar', {
            idrepartidor: user.usuario.idrepartidor,
            online: 1
        });
    }

    /**
     * Accept an order
     */
    async acceptOrder(idpedido: number): Promise<boolean> {
        try {
            const user = this.auth.currentUser();
            if (!user?.usuario?.idrepartidor) return false;

            // Get all pending order IDs
            const pendingOrders = await this.getPedidosPorAceptar();
            if (!pendingOrders || !pendingOrders.pedidos) return false;

            const ids = pendingOrders.pedidos.join(',');

            const data = {
                idpedido: ids,
                repartidor: user.usuario
            };

            const response: any = await lastValueFrom(
                this.http.post('repartidor/set-asignar-pedido', data)
            );

            // Update local order status
            const currentOrders = this.orders();
            const updatedOrders = currentOrders.map(o => {
                if (o.idpedido === idpedido) {
                    return { ...o, pwa_delivery_status: 1 };
                }
                return o;
            });
            this.orders.set(updatedOrders);
            await this.storage.set('sys::pr::it', updatedOrders);

            return true;
        } catch (error) {
            console.error('Error accepting order:', error);
            return false;
        }
    }

    /**
     * Get pending orders for a specific sede (for Repartidor Propio)
     */
    async getPendingOrdersForSede(idsede: number): Promise<any[]> {
        try {
            const response: any = await lastValueFrom(
                this.http.get('repartidor/get-list-pedidos-pendientes-comercio', { idsede })
            );

            if (response && response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching pending orders for sede:', error);
            return [];
        }
    }

    /**
     * Assign a specific order to self (Repartidor Propio flow)
     * Solo permite asignar si el repartidor está online
     */
    async assignOrderToSelf(order: any): Promise<boolean> {
        try {
            const user = this.auth.currentUser();
            if (!user?.usuario?.idrepartidor) return false;

            // Verificar que el repartidor esté online
            if (!this.auth.isOnline()) {
                return false;
            }

            const currentOrders = this.orders();
            const currentIds = currentOrders.map(o => o.idpedido);

            // Adjuntar el nuevo idpedido a los existentes y asegurar que no se repitan
            const allIds = Array.from(new Set([...currentIds, order.idpedido]));

            // Calcular el importe acumulado (suma de todos los pedidos)
            const currentTotal = currentOrders.reduce((acc, o) => acc + (parseFloat(o.total_r || o.total) || 0), 0);
            const newOrderTotal = parseFloat(order.total_r || order.total) || 0;
            const totalAcumulado = currentTotal + newOrderTotal;

            // Prepare payload with accumulated orders
            const payload = {
                pedido: {
                    pedidos: allIds,
                    pedido_asignado_manual: order.idpedido,
                    importe_acumula: totalAcumulado,
                    importe_pagar: totalAcumulado,
                    idsede: order.idsede,
                    idrepartidor: user.usuario.idrepartidor,
                    inSede: true,
                    isexpress: 0
                },
                repartidor: user.usuario
            };

            await lastValueFrom(
                this.http.post('monitor/set-asignar-pedido-manual', payload)
            );

            // IMPORTANT: Mark as accepted for PWA logic
            const acceptedOrder = {
                ...order,
                pwa_delivery_status: 1,
                time_line: {
                    paso: 0,
                    fecha_hora: new Date().toISOString()
                }
            };

            // Notify client via socket (already accepted)
            const clientNotification = {
                nombre: order.json_datos_delivery?.p_header?.arrDatosDelivery?.nombre?.split(' ')[0] || 'Cliente',
                telefono: order.json_datos_delivery?.p_header?.arrDatosDelivery?.telefono || '',
                idpedido: order.idpedido,
                repartidor_nom: user.nombres || user.usuario.nombre,
                repartidor_telefono: user.usuario.telefono,
                idsede: order.idsede,
                idorg: order.idorg,
                repartidor_red: 1
            };
            this.socket.emit('repartidor-notifica-cliente-acepto-pedido', [clientNotification]);

            // Save locally so loadOrders() picks it up as accepted
            this.orders.set([...currentOrders, acceptedOrder]);
            await this.storage.set('sys::pr::it', this.orders());

            return true;
        } catch (error) {
            console.error('Error assigning order to self:', error);
            throw error;
        }
    }

    /**
     * Release/Cancel an order with a reason
     * Cancela el pedido y notifica al servidor
     */
    async liberarPedido(idpedido: number, motivo: string): Promise<boolean> {
        try {
            const user = this.auth.currentUser();
            if (!user?.usuario?.idrepartidor) return false;

            // Obtener el pedido para extraer idsede
            const order = this.orders().find(o => o.idpedido === idpedido);
            if (!order) {
                console.error('No se encontró el pedido a cancelar');
                return false;
            }

            // Extraer idsede del pedido
            const deliveryData = order.json_datos_delivery?.p_header?.arrDatosDelivery
                || order.json_datos_delivery?.arrDatosDelivery
                || order.json_datos_delivery
                || {};

            const idsede = deliveryData?.establecimiento?.idsede || order.idsede;

            if (!idsede) {
                console.error('No se pudo obtener idsede del pedido');
                return false;
            }

            const payload = {
                idpedido: idpedido,
                idsede: idsede,
                idrepartidor: user.usuario.idrepartidor,
                motivo: motivo
            };

            // Notificar al servidor sobre la cancelación
            await lastValueFrom(
                this.http.post('repartidor/set-pedido-delivery-cancelado', payload)
            );

            // Notificar por socket para que otros vean el pedido liberado
            this.socket.emit('repartidor-notifica-libero-pedido', {
                idpedido: idpedido,
                motivo: motivo
            });

            // Remover de la lista local
            // Angular manejará la animación :leave automáticamente
            await this.removeOrder(idpedido);

            return true;
        } catch (error) {
            console.error('[OrderService] ❌ Error cancelando pedido:', error);
            return false;
        }
    }

    private checkProximity(pos: any, order: any) {
        // Check if arrived at commerce
        if (this.deliveryStep() < 2) {
            const commerce = order.json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
            const dist = GeoUtils.calcDistance(
                pos.coords.latitude, pos.coords.longitude,
                parseFloat(commerce.latitude), parseFloat(commerce.longitude)
            );

            if (dist < 100) { // 100 meters
                this.deliveryStep.set(2);
                // Notify server: Arrived
                // this.socket.emit('...', ...);
            }
        }
    }

    /**
     * Notifica la ubicación del repartidor por socket al cliente, comercio y monitor
     */
    private notifyLocationToSocket(pos: any, order: any) {
        try {
            // Extraer datos del pedido
            const deliveryData = order.json_datos_delivery?.p_header?.arrDatosDelivery
                || order.json_datos_delivery?.arrDatosDelivery
                || order.json_datos_delivery
                || {};

            const idcliente = deliveryData?.idcliente || order.idcliente;
            const idsede = deliveryData?.establecimiento?.idsede || order.idsede;

            // Preparar datos de ubicación
            const datosUbicacion = {
                idrepartidor: this.auth.currentUser()?.usuario.idrepartidor,
                idcliente: idcliente,
                idsede: idsede,
                coordenadas: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp
                },
                idpedido: order.idpedido
            };

            // Enviar por socket
            this.socket.emit('repartidor-notifica-ubicacion', datosUbicacion);

            const now = Date.now();
            if (!this.lastLocationNotification || now - this.lastLocationNotification > 10000) {
                this.lastLocationNotification = now;
            }
        } catch (error) {
            console.error('[OrderService] Error notificando ubicación:', error);
        }
    }

    private lastLocationNotification: number = 0;

    /**
     * Check if driver has arrived at business location
     * Automatically updates timeline based on GPS position
     */
    checkLLegoComercio() {
        const currentPos = this.geo.currentPosition();
        if (!currentPos) return;

        const allOrders = this.orders();
        if (!allOrders || allOrders.length === 0) return;

        const updatedOrders = allOrders.map(order => {
            // Initialize timeline if not exists
            if (!order.time_line) {
                order.time_line = createDefaultTimeLine();
            }

            const commerce = order.json_datos_delivery?.p_header?.arrDatosDelivery?.establecimiento;
            if (!commerce?.latitude || !commerce?.longitude) {
                return order;
            }

            const commerceLat = typeof commerce.latitude === 'string' ? parseFloat(commerce.latitude) : commerce.latitude;
            const commerceLon = typeof commerce.longitude === 'string' ? parseFloat(commerce.longitude) : commerce.longitude;

            // Calculate distance to business
            const distanceMeters = this.geo.calcDistanciaEnMetros(
                currentPos.coords.latitude,
                currentPos.coords.longitude,
                commerceLat,
                commerceLon
            );

            order.distanciaMtr = Math.round(distanceMeters).toString();

            // Check if within 100m of business
            const isLLego = distanceMeters <= 100;

            const timeline: TimeLinePedido = order.time_line;

            if (isLLego) {
                // Driver arrived at business
                if (timeline.llego_al_comercio !== true) {
                    timeline.llego_al_comercio = true;
                    timeline.paso = 1;
                    timeline.msj_log = (timeline.msj_log || '') + `paso 1 ${new Date().toLocaleTimeString()} `;

                    // Emit socket event to notify client
                    this.socket.emit('repartidor-notifica-cliente-time-line-one', {
                        idpedido: order.idpedido,
                        time_line: timeline
                    });
                }
            } else {
                // Driver left business (en route to client)
                // Only transition to paso 2 if driver has already arrived at commerce (paso === 1)
                // AND has actually been marked as arrived (llego_al_comercio === true)
                if (timeline.paso === 1 && timeline.llego_al_comercio === true) {
                    timeline.en_camino_al_cliente = true;
                    timeline.paso = 2;
                    timeline.msj_log = (timeline.msj_log || '') + `paso 2 ${new Date().toLocaleTimeString()} `;

                    // Emit socket event to notify client
                    this.socket.emit('repartidor-notifica-cliente-time-line-one', {
                        idpedido: order.idpedido,
                        time_line: timeline
                    });
                }
            }

            order.time_line = timeline;
            return order;
        });

        // Update orders signal with new timeline data
        this.orders.set(updatedOrders);

        // Save to storage
        this.storage.set('sys::pr::it', updatedOrders).catch((err: any) =>
            console.error('Error saving updated orders:', err)
        );
    }

    /**
     * Remove order from the list by ID
     */
    async removeOrder(idpedido: number) {
        // Get all current orders before removal
        const currentOrders = this.orders();

        // Find the order being removed
        const orderToRemove = currentOrders.find(o => o.idpedido === idpedido);

        // Update orders list (remove the order)
        const remainingOrders = currentOrders.filter(o => o.idpedido !== idpedido);
        this.orders.set(remainingOrders);

        // Save updated list to storage
        await this.storage.set('sys::pr::it', remainingOrders);

        // IMPORTANTE: También remover de sys::pXa para evitar que reaparezca al recargar
        const pedidosPorAceptar = await this.getPedidosPorAceptar();
        if (pedidosPorAceptar && pedidosPorAceptar.pedidos) {
            pedidosPorAceptar.pedidos = pedidosPorAceptar.pedidos.filter((id: number) => id !== idpedido);
            await this.setPedidosPorAceptar(pedidosPorAceptar);
        }

        // If no more orders remain, notify server that the group is completed
        if (remainingOrders.length === 0) {
            await this.notifyAllOrdersCompleted();
        }
    }

    /**
     * Notify server that all orders in the group have been delivered and removed
     * This is called when the last delivered order is removed from the list
     */
    private async notifyAllOrdersCompleted() {
        try {
            const user = this.auth.currentUser();

            if (!user?.usuario?.idrepartidor) {
                return;
            }

            // Emit socket event to notify that all orders in this group are completed
            this.socket.emit('repartidor-grupo-pedido-finalizado', user.usuario.idrepartidor);

            // Clean local storage
            await this.cleanLocalStorage();

        } catch (error) {
            console.error('Error notifying orders completed:', error);
        }
    }

    /**
     * Clean local storage for orders
     */
    private async cleanLocalStorage() {
        try {
            await this.storage.remove('sys::pXa'); // Pending orders
            await this.storage.remove('sys::pr::it'); // Current orders
        } catch (error) {
            console.error('Error cleaning storage:', error);
        }
    }

    private playAudioNewPedido() {
        try {
            const audio = new Audio();
            audio.src = 'assets/audio/Alarm04.wav';
            audio.load();
            audio.play().catch(() => { });
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }
}