import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '../../core/services/http.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { StorageService } from '../../core/services/storage.service';
import { OrderService } from '../../core/services/order.service';

@Component({
    selector: 'app-assign-order',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assign-order.component.html',
    styleUrl: './assign-order.component.scss'
})
export class AssignOrderComponent {
    private http = inject(HttpService);
    private router = inject(Router);
    private auth = inject(AuthService);
    private socket = inject(SocketService);
    private storage = inject(StorageService);
    private orderService = inject(OrderService);

    orderCode: string = '';
    isLoading: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';

    async assignOrder() {

        if (!this.orderCode.trim()) {
            this.errorMessage = 'Por favor ingresa un código de pedido';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        try {
            // Check current assigned orders count (max 3 orders rule)
            const countPedidosAsignados = parseInt(await this.storage.get('sys::count::p') || '0');

            if (countPedidosAsignados >= 3) {
                this.errorMessage = 'Ya tienes muchos pedidos! Entrega lo que tienes primero.';
                this.isLoading = false;
                return;
            }

            // Step 1: Get order by ID (convert Observable to Promise)
            const orderResponse: any = await lastValueFrom(
                this.http.post('comercio/get-pedido-by-id', {
                    idpedido: this.orderCode.trim()
                })
            );

            if (!orderResponse || !orderResponse.data || orderResponse.data.length === 0) {
                this.errorMessage = 'No se encontró el pedido con ese código';
                this.isLoading = false;
                return;
            }

            const order = orderResponse.data[0];

            // Parse json_datos_delivery if it's a string
            if (typeof order.json_datos_delivery === 'string') {
                order.json_datos_delivery = JSON.parse(order.json_datos_delivery);
            }

            // Check if order is already assigned
            if (order.idrepartidor) {
                this.errorMessage = 'Ya tiene repartidor asignado.';
                this.isLoading = false;
                return;
            }

            const user = <any>this.auth.currentUser();
            const importePedido = order.total_r ? parseFloat(order.total_r) : parseFloat(order.total);

            // Step 2: Get existing pending orders or create new structure
            const currentPedidos = await this.orderService.getPedidosPorAceptar() || {
                pedidos: [],
                importe_acumula: 0,
                importe_pagar: 0,
                idsede: order.idsede,
                idrepartidor: user?.usuario?.idrepartidor || user?.usuario,
                inSede: true
            };

            // Check if order is already in the list
            if (currentPedidos.pedidos.includes(order.idpedido)) {
                this.errorMessage = 'Este pedido ya está en tu lista.';
                this.isLoading = false;
                return;
            }

            // Add new order to the list
            currentPedidos.pedidos.push(order.idpedido);
            currentPedidos.importe_acumula = parseFloat(currentPedidos.importe_acumula || '0') + importePedido;
            currentPedidos.importe_pagar = parseFloat(currentPedidos.importe_pagar || '0') + importePedido;
            currentPedidos.pedido_asignado_manual = order.idpedido;
            currentPedidos.idrepartidor = user?.usuario?.idrepartidor || user?.usuario;
            currentPedidos.idsede = order.idsede;

            // Step 3: Assign order via API
            await lastValueFrom(
                this.http.post('monitor/set-asignar-pedido-manual', {
                    pedido: currentPedidos,
                    repartidor: user?.usuario
                })
            );

            // Step 4: Save to localStorage using OrderService
            await this.orderService.setPedidosPorAceptar(currentPedidos);

            // Step 5: Update local count
            await this.storage.set('sys::count::p', (countPedidosAsignados + 1).toString());

            // Step 6: Notify client via socket
            const clientNotification = {
                nombre: order.json_datos_delivery?.p_header?.arrDatosDelivery?.nombre?.split(' ')[0] || 'Cliente',
                telefono: order.json_datos_delivery?.p_header?.arrDatosDelivery?.telefono || '',
                idpedido: order.idpedido,
                repartidor_nom: user?.nombres || user?.usuario,
                repartidor_telefono: user?.usuario, // Assuming this is phone or ID
                idsede: order.idsede,
                idorg: order.idorg,
                repartidor_red: 1 // red papaya
            };

            this.socket.emit('repartidor-notifica-cliente-acepto-pedido', [clientNotification]);

            // Success!
            this.successMessage = `¡Pedido #${order.idpedido} asignado correctamente!`;

            // Step 7: Reload orders in OrderService
            await this.orderService.loadOrders();

            // Navigate back after a short delay
            setTimeout(() => {
                this.router.navigate(['/home']);
            }, 1500);

        } catch (error: any) {

            this.errorMessage = error?.error?.mensaje || error?.error?.message || 'Error al asignar el pedido. Verifica el código e intenta nuevamente.';
            this.isLoading = false;
        }
    }

    private async verificarTiempoAsignacion(): Promise<boolean> {
        // Check if 10 minutes have passed since last assignment
        const lastAssignTime = await this.storage.get('sys::last::assign::time');

        if (!lastAssignTime) {
            // First assignment, allow it and set time
            await this.storage.set('sys::last::assign::time', Date.now().toString());
            return true;
        }

        const timeDiff = Date.now() - parseInt(lastAssignTime);
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (timeDiff >= tenMinutes) {
            // More than 10 minutes passed, update time and allow
            await this.storage.set('sys::last::assign::time', Date.now().toString());
            return true;
        }

        // Less than 10 minutes, don't allow
        return false;
    }

    goBack() {
        this.router.navigate(['/home']);
    }
}
