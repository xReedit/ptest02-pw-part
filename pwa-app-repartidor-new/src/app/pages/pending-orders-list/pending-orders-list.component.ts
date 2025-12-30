import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-pending-orders-list',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('orderAnimation', [
      transition(':leave', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 0,
          transform: 'translateX(50px)',
          height: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0
        }))
      ])
    ])
  ],
  templateUrl: './pending-orders-list.component.html',
  styleUrls: ['./pending-orders-list.component.scss']
})
export class PendingOrdersListComponent implements OnInit {
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  pendingOrders = signal<any[]>([]);
  myOrdersCount = computed(() => this.orderService.orders().length);
  isLoading = signal(false);
  isAssigning = signal(false);
  currentAssigningId = signal<number | null>(null);

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    const user = this.auth.currentUser();
    const idsede_suscrito = user?.usuario?.idsede_suscrito;

    if (!idsede_suscrito) {
      // Should not happen if guarded correctly
      return;
    }

    this.isLoading.set(true);
    try {
      const orders = await this.orderService.getPendingOrdersForSede(idsede_suscrito);
      this.pendingOrders.set(orders);
    } catch (error) {

    } finally {
      this.isLoading.set(false);
    }
  }

  async assignOrder(order: any) {
    if (this.isAssigning()) return;

    this.isAssigning.set(true);
    this.currentAssigningId.set(order.idpedido);

    try {
      const success = await this.orderService.assignOrderToSelf(order);
      if (success) {
        // Remove the assigned order from the local list so the driver can keep picking others
        this.pendingOrders.update(orders => {
          const newList = orders.filter(o => o.idpedido !== order.idpedido);
          // If no more orders, go back automatically
          if (newList.length === 0) {
            setTimeout(() => this.router.navigate(['/home']), 500);
          }
          return newList;
        });
      }
    } catch (error) {

      alert('Error al asignar el pedido. Intenta nuevamente.');
    } finally {
      this.isAssigning.set(false);
      this.currentAssigningId.set(null);
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  getCommerceName(order: any): string {
    try {
      const data = typeof order.json_datos_delivery === 'string'
        ? JSON.parse(order.json_datos_delivery)
        : order.json_datos_delivery;
      return data?.p_header?.arrDatosDelivery?.establecimiento?.nombre || 'Comercio';
    } catch {
      return 'Comercio';
    }
  }

  getClientName(order: any): string {
    try {
      const data = typeof order.json_datos_delivery === 'string'
        ? JSON.parse(order.json_datos_delivery)
        : order.json_datos_delivery;
      return data?.p_header?.arrDatosDelivery?.nombre || 'Cliente';
    } catch {
      return 'Cliente';
    }
  }

  getAddress(order: any): string {
    try {
      const data = typeof order.json_datos_delivery === 'string'
        ? JSON.parse(order.json_datos_delivery)
        : order.json_datos_delivery;
      return data?.p_header?.arrDatosDelivery?.direccionEnvioSelected?.direccion || 'Dirección no disponible';
    } catch {
      return 'Dirección no disponible';
    }
  }

  getPaymentMethod(order: any): string {
    try {
      const data = typeof order.json_datos_delivery === 'string'
        ? JSON.parse(order.json_datos_delivery)
        : order.json_datos_delivery;
      return data?.p_header?.arrDatosDelivery?.metodoPago?.descripcion || 'Efectivo';
    } catch {
      return 'Efectivo';
    }
  }

  getPaymentClass(order: any): string {
    const method = this.getPaymentMethod(order).toUpperCase();
    if (method.includes('EFECTIVO')) return 'payment-cash';
    if (method.includes('YAPE')) return 'payment-yape';
    if (method.includes('PLIN')) return 'payment-plin';
    if (method.includes('TARJETA') || method.includes('CARD')) return 'payment-card';
    return 'payment-other';
  }

  getElapsedTime(order: any): string {
    if (!order.fecha_hora) return order.hora || 'Ahora';

    const orderDate = new Date(order.fecha_hora);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
}
