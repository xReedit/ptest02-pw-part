import { Component, computed, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';

import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { OrderDetailsModalComponent } from '../order-details-modal/order-details-modal.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, OrderDetailsModalComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('220ms cubic-bezier(0.2, 0, 0, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translateY(-6px)' }))
      ])
    ]),
    trigger('orderAnimation', [
      transition(':leave', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 0,
          transform: 'translateX(100%) scale(0.8)',
          height: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0
        }))
      ])
    ])
  ]
})
export class OrderListComponent implements OnDestroy {

  private orderService = inject(OrderService);
  private router = inject(Router);
  public auth = inject(AuthService);
  private uiService = inject(UiService);

  orders = computed(() => this.orderService.orders());
  isRepartidorPropio = computed(() => !!this.auth.currentUser()?.usuario?.idsede_suscrito);

  // Modal state
  selectedOrder: any = null;
  isModalOpen = false;

  // Countdown state for offered orders
  countdowns = new Map<number, number>();
  private countdownInterval: any;

  constructor() {
    // Effect to manage countdowns when orders change
    effect(() => {
      const currentOrders = this.orders();
      this.manageCountdowns(currentOrders);
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  async refresh() {

    await this.orderService.loadOrders();
  }

  goToAssignOrder() {
    const user = this.auth.currentUser();
    if (user?.usuario?.idsede_suscrito) {
      this.router.navigate(['/pending-orders-list']);
    } else {
      this.router.navigate(['/assign-order']);
    }
  }

  viewDetails(order: any) {
    this.selectedOrder = order;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  /**
   * Check if order is in "Offered" state (not yet accepted)
   */
  isOffered(order: any): boolean {
    // For Repartidor Propio, orders are NEVER offered, they are always assigned or picked by them
    const user = this.auth.currentUser();
    if (user?.usuario?.idsede_suscrito) {
      return false;
    }

    // Si fue asignado manualmente, NO mostrar como oferta (ya está aceptado implícitamente)
    if (order.pedido_asignado_manual) {
      return false;
    }

    // pwa_delivery_status === 0 significa que es una oferta pendiente de aceptar
    // pwa_delivery_status >= 1 significa que ya fue aceptado
    return !order.pwa_delivery_status || order.pwa_delivery_status === 0;
  }

  /**
   * Accept an offered order
   */
  async acceptOrder(order: any, event: Event) {
    event.stopPropagation();
    try {
      const success = await this.orderService.acceptOrder(order.idpedido);
      if (success) {
        // Stop countdown for this order
        this.countdowns.delete(order.idpedido);
      }
    } catch (error) {

    }
  }

  /**
   * Get countdown value for an order
   */
  getCountdown(order: any): number {
    return this.countdowns.get(order.idpedido) || 60;
  }

  /**
   * Get progress percentage for countdown bar
   */
  getCountdownProgress(order: any): number {
    const seconds = this.getCountdown(order);
    return (seconds / 60) * 100;
  }

  private manageCountdowns(orders: any[]) {
    // Initialize countdowns for new offered orders
    let hasOffers = false;

    orders.forEach(order => {
      if (this.isOffered(order)) {
        hasOffers = true;
        if (!this.countdowns.has(order.idpedido)) {
          this.countdowns.set(order.idpedido, 60); // Start with 60 seconds
        }
      } else {
        // Remove countdown if order is no longer offered
        this.countdowns.delete(order.idpedido);
      }
    });

    // Start interval if needed and not running
    if (hasOffers && !this.countdownInterval) {
      this.countdownInterval = setInterval(() => {
        this.updateCountdowns();
      }, 1000);
    } else if (!hasOffers && this.countdownInterval) {
      // Stop interval if no offers
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdowns() {
    this.countdowns.forEach((seconds, id) => {
      if (seconds > 0) {
        this.countdowns.set(id, seconds - 1);
      } else {
        // Expired? For now just stay at 0
        // Maybe auto-remove or show expired state
      }
    });
    // Trigger change detection implicitly by updating the Map?
    // Angular signals might not catch Map internal changes, but the template uses getCountdown()
    // We might need to force refresh if using OnPush, but default is Default.
  }

  getElapsedTime(order: any): string {
    if (!order.fecha_hora) return 'Ahora';

    const orderDate = new Date(order.fecha_hora);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}min`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) return `${hours}hr`;
    return `${hours}hr ${minutes}min`;
  }

  getTimeClass(order: any): string {
    if (!order.fecha_hora) return 'time-green';

    const orderDate = new Date(order.fecha_hora);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 15) return 'time-green';
    if (diffMinutes >= 15 && diffMinutes < 25) return 'time-yellow';
    return 'time-red';
  }

  getPaymentClass(order: any): string {
    const paymentData = order.json_datos_delivery?.p_header?.arrDatosDelivery?.metodoPago
      || order.json_datos_delivery?.arrDatosDelivery?.metodoPago
      || order.json_datos_delivery?.metodoPago;

    const paymentMethod = paymentData?.descripcion || 'EFECTIVO';
    const method = paymentMethod.toUpperCase();

    if (method.includes('EFECTIVO')) return 'payment-cash';
    if (method.includes('YAPE')) return 'payment-yape';
    if (method.includes('PLIN')) return 'payment-plin';
    if (method.includes('TARJETA') || method.includes('CARD')) return 'payment-card';
    return 'payment-other';
  }

  /**
   * Get timeline status class for visual indicator
   */
  getTimelineClass(order: any): string {
    const paso = order.time_line?.paso ?? 0;

    switch (paso) {
      case 0: return 'timeline-going';      // Yendo al comercio
      case 1: return 'timeline-arrived';    // En el comercio
      case 2: return 'timeline-enroute';    // En camino al cliente
      case 3: return 'timeline-delivered';  // Entregado
      default: return 'timeline-going';
    }
  }

  /**
   * Get timeline status icon SVG path
   */
  getTimelineIcon(order: any): string {
    const paso = order.time_line?.paso ?? 0;

    switch (paso) {
      case 0: // Yendo al comercio - icon: navigation
        return 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z';
      case 1: // En el comercio - icon: store
        return 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z';
      case 2: // En camino - icon: delivery truck
        return 'M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.1.9-2 2-2h14v4z';
      case 3: // Entregado - icon: check circle
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';
      default:
        return 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z';
    }
  }

  /**
   * Get human-readable timeline status text
   */
  getTimelineText(order: any): string {
    const paso = order.time_line?.paso ?? 0;

    switch (paso) {
      case 0: return 'Yendo';
      case 1: return 'En comercio';
      case 2: return 'En camino';
      case 3: return 'Entregado';
      default: return 'Pendiente';
    }
  }

  /**
   * Remove order from the list with animation
   */
  async removeOrder(order: any, event: Event) {
    event.stopPropagation(); // Prevent opening modal
    
    // Delegate to OrderService which handles animation timing
    await this.orderService.removeOrder(order.idpedido);
  }

  /**
   * Track by function for ngFor to enable proper animations
   */
  trackByOrderId(index: number, order: any): any {
    return order.idpedido;
  }
}