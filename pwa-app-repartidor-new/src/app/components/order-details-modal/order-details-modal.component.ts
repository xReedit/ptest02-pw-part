import { Component, Input, Output, EventEmitter, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeLinePedido, createDefaultTimeLine } from '../../core/models/time-line-pedido.model';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { UiService } from '../../core/services/ui.service';
import { environment } from '../../../environments/environment';
import { OnChanges, SimpleChanges, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-order-details-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './order-details-modal.component.html',
    styleUrl: './order-details-modal.component.scss'
})
export class OrderDetailsModalComponent implements OnInit, OnChanges, OnDestroy {
    @Input() order: any = null;
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    isRepartidorPropio = computed(() => !!this.authService.currentUser()?.usuario?.idsede_suscrito);

    // Processed data
    dataPedido: any;
    importeEfectivo = '';
    indicacionesComprobante = '';
    comprobanteSolicitar = '';

    // Coordinates
    coordenadasComercio: any = {};
    coordenadasCliente: any = {};

    // Release order states
    showLiberarPrompt = false;
    motivoLiberacion = '';
    isLiberando = false;
    currentTime = Date.now();
    private timerInterval: any;

    constructor(
        private orderService: OrderService,
        private authService: AuthService,
        private socket: SocketService,
        private geo: GeolocationService,
        private uiService: UiService
    ) { }

    ngOnInit() {
        if (this.order) {
            this.processOrderData();

        }

        // Update current time every second to check liberation eligibility
        this.timerInterval = setInterval(() => {
            this.currentTime = Date.now();
        }, 1000);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.order) {
            this.processOrderData();
        }

        // Si el estado de isOpen cambia, gestionamos el botón de atrás
        if (changes['isOpen']) {
            if (this.isOpen) {

                this.uiService.setBackHandler(() => {

                    this.closeModal();
                    return true;
                });
            } else {

                this.uiService.setBackHandler(null);
            }
        }
    }

    ngOnDestroy() {
        // Asegurar limpieza si el componente se destruye
        this.uiService.setBackHandler(null);
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    processOrderData() {
        // Extract main data structure
        // 🔍 Robust Delivery Data extraction
        const deliveryData = this.order.json_datos_delivery?.p_header?.arrDatosDelivery
            || this.order.json_datos_delivery?.arrDatosDelivery
            || this.order.json_datos_delivery
            || {};


        if (!deliveryData) {

            return;
        }

        // Store processed data
        this.dataPedido = {
            datosDelivery: deliveryData,
            datosCliente: {
                latitude: deliveryData.direccionEnvioSelected?.latitude || deliveryData.latitude,
                longitude: deliveryData.direccionEnvioSelected?.longitude || deliveryData.longitude,
                nombre: deliveryData.direccionEnvioSelected?.nombre || deliveryData.nombre || 'Cliente'
            }
        };

        // Extract payment method
        this.importeEfectivo = deliveryData.metodoPago?.importe || '';

        // Extract comprobante (invoice) information
        const dni = deliveryData.tipoComprobante?.dni || '';
        const dniRuc = dni === '' ? '' : dni.length > 8 ? 'RUC ' : 'DNI ';
        const otro = deliveryData.tipoComprobante?.otro || '';

        this.indicacionesComprobante = dni === ''
            ? 'Publico en general.'
            : `${dniRuc}${dni} - ${otro}`;

        this.comprobanteSolicitar = deliveryData.tipoComprobante?.descripcion || 'Boleta';

        // Set coordinates
        this.coordenadasComercio = {
            latitude: deliveryData.establecimiento?.latitude,
            longitude: deliveryData.establecimiento?.longitude
        };

        this.coordenadasCliente = {
            latitude: this.dataPedido.datosCliente.latitude,
            longitude: this.dataPedido.datosCliente.longitude
        };
    }

    /**
     * Get Total to collect from the client
     * Calculation: Net merchant amount + delivery cost
     */
    get totalACobrar(): number {
        const neto = parseFloat(this.order?.importe_pagar_comercio || 0);
        const delivery = parseFloat(this.dataPedido?.datosDelivery?.costoTotalDelivery || 0);
        return neto + delivery;
    }

    /**
     * Get Total that the delivery person must pay at the merchant
     * This is the net amount without delivery
     */
    get totalAPagar(): number {
        return parseFloat(this.order?.importe_pagar_comercio || 0);
    }

    closeModal() {
        this.close.emit();
    }

    callPhone(phone: string) {
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        }
    }

    callComercio() {
        const phone = this.dataPedido?.datosDelivery?.establecimiento?.telefono;
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        }
    }

    callCliente() {
        const phone = this.dataPedido?.datosDelivery?.telefono;
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        }
    }

    openWhatsApp(phone?: string) {
        const phoneToUse = phone || this.dataPedido?.datosDelivery?.telefono;
        if (phoneToUse) {
            // Remove non-numeric characters and add Peru country code if needed
            let cleanPhone = phoneToUse.replace(/\D/g, '');
            if (!cleanPhone.startsWith('51')) {
                cleanPhone = '51' + cleanPhone;
            }
            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}`, '_blank');
        }
    }

    async irAlComercio() {
        const destinoLat = this.coordenadasComercio.latitude;
        const destinoLng = this.coordenadasComercio.longitude;

        if (!destinoLat || !destinoLng) {

            return;
        }

        // Usar Google Maps Universal Link que funciona mejor en dispositivos nativos
        // y dispara el selector de apps (Google Maps, Waze, etc.)
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destinoLat},${destinoLng}&travelmode=driving`;

        window.open(url, '_system');
    }

    async irADireccionCliente() {
        const destinoLat = this.coordenadasCliente.latitude;
        const destinoLng = this.coordenadasCliente.longitude;

        if (!destinoLat || !destinoLng) {

            return;
        }

        const url = `https://www.google.com/maps/dir/?api=1&destination=${destinoLat},${destinoLng}&travelmode=driving`;

        window.open(url, '_system');
    }

    /**
     * Check if "Liberar Pedido" button should be visible
     * Minimum 2 minutes (120,000 ms) since acceptance
     */
    get canLiberarPedido(): boolean {
        const timeline = this.order?.time_line;
        if (!timeline?.hora_pedido_aceptado) return true; // Default to true if no timestamp (legacy)

        const acceptTime = timeline.hora_pedido_aceptado;
        const diff = this.currentTime - acceptTime;
        return diff >= 120000; // 2 minutes in ms
    }

    /**
     * Check if "Pedido Entregado" button should be enabled
     * Button is only enabled when driver is en route to client (paso >= 2)
     */
    get canMarkAsDelivered(): boolean {
        const timeline: TimeLinePedido = this.order?.time_line || createDefaultTimeLine();
        // Enable button only if driver has left the business (paso >= 2)
        return timeline.paso >= 2;
    }

    /**
     * Get current delivery stage text
     */
    get deliveryStageText(): string {
        const timeline: TimeLinePedido = this.order?.time_line || createDefaultTimeLine();

        switch (timeline.paso) {
            case 0:
                return 'Dirigiéndose al comercio';
            case 1:
                return 'En el comercio';
            case 2:
                return 'En camino al cliente';
            case 3:
                return 'Entregado';
            default:
                return 'Estado desconocido';
        }
    }

    /**
     * Mark order as delivered
     */
    markAsDelivered() {
        if (!this.canMarkAsDelivered) {

            return;
        }

        // Initialize timeline if not exists
        if (!this.order.time_line) {
            this.order.time_line = createDefaultTimeLine();
        }

        // Set delivery timestamp
        this.order.time_line.hora_pedido_entregado = new Date().getTime();
        this.order.time_line.paso = 3;

        // Update order state
        this.order.pwa_estado = 'E'; // E = Entregado
        this.order.estado = 2; // 2 = Delivered

        // Notify client via socket
        this.socket.emit('repartidor-notifica-cliente-time-line-one', {
            idpedido: this.order.idpedido,
            time_line: this.order.time_line
        });

        // Prepare data for server notification
        const user = this.authService.currentUser();
        const deliveryData = this.dataPedido?.datosDelivery || {};
        const dataPedido = {
            idpedido: this.order.idpedido,
            idrepartidor: user?.usuario?.idrepartidor,
            idsede: deliveryData.establecimiento?.idsede || this.order.idsede,
            idorg: this.order.idorg,
            datosComercio: deliveryData.establecimiento ? {
                idsede: deliveryData.establecimiento.idsede,
                nombre: deliveryData.establecimiento.nombre
            } : null
        };

        // Notify server that order is delivered
        this.socket.emit('repartidor-notifica-fin-one-pedido', dataPedido);

        // Close modal immediately to show smooth transition
        this.closeModal();

        // Remove order from list with smooth animation after a short delay
        setTimeout(() => {
            this.orderService.removeOrder(this.order.idpedido);
        }, 300);
    }

    /**
     * Start the release process
     */
    solicitarLiberarPedido() {
        this.showLiberarPrompt = true;
        this.motivoLiberacion = '';
    }

    /**
     * Cancel the release process
     */
    cancelarLiberarPedido() {
        this.showLiberarPrompt = false;
        this.motivoLiberacion = '';
    }

    /**
     * Confirm and execute order release
     */
    async confirmarLiberarPedido() {
        if (!this.motivoLiberacion.trim()) {

            return;
        }

        this.isLiberando = true;
        
        // Cerrar el modal inmediatamente para mejor UX
        this.closeModal();
        
        // Ejecutar la liberación en segundo plano
        // El OrderService se encarga de la animación y remoción
        const success = await this.orderService.liberarPedido(this.order.idpedido, this.motivoLiberacion);

        if (success) {

        } else {

        }
        
        this.isLiberando = false;
        this.showLiberarPrompt = false;
    }
}
