import { Component, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { SocketService } from '../../core/services/socket.service';
import { HttpService } from '../../core/services/http.service';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { MapComponent } from '../../components/map/map.component';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderListComponent, MapComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  activeTab: 'list' | 'map' = 'list';
  isSideMenuOpen = false;
  isChangePasswordModalOpen = false;
  isChangingPassword = false;
  passwordError = '';
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  repartidorNombre: any;
  isRepartidorPropio = computed(() => !!this.auth.currentUser()?.usuario?.idsede_suscrito);
  private router = inject(Router);

  // Development mode flag
  isDevelopment = !environment.production;

  // Debounce for GPS checks
  private lastGPSCheck = 0;
  private GPS_CHECK_INTERVAL = 3000; // Check every 3 seconds max

  constructor(
    public auth: AuthService,
    private socketService: SocketService,
    public geo: GeolocationService,
    public orderService: OrderService,
    private http: HttpService
  ) {
    // Usar effect para efectos secundarios (sockets, logs)
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.socketService.connect();

        // Solicitar pedidos pendientes explícitamente al entrar/recargar
        this.orderService.emitRequestPendingOrders();

        this.repartidorNombre = user?.usuario?.nombre
          ? user.usuario.nombre.charAt(0).toUpperCase() + user.usuario.nombre.slice(1).toLowerCase()
          : 'Repartidor';
      }
    });

    // Effect para monitorear cambios de posición GPS y actualizar timeline
    // IMPORTANTE: Usamos debouncing para evitar bucles infinitos
    effect(() => {
      const position = this.geo.currentPosition();

      if (position) {
        // Debounce: solo verificar cada X segundos
        const now = Date.now();
        if (now - this.lastGPSCheck >= this.GPS_CHECK_INTERVAL) {
          this.lastGPSCheck = now;

          // Usar setTimeout para sacar la operación del ciclo de detección de cambios
          setTimeout(() => {
            this.orderService.checkLLegoComercio();
          }, 0);
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // En desarrollo, el GPS puede no estar disponible
    if (!environment.production) {
      // Intentar GPS pero no fallar si no está disponible
      try {
        const hasPermission = await this.geo.checkPermissions();
        if (hasPermission) {
          await this.geo.getCurrentPosition();
          await this.geo.startWatchingPosition();
        }
      } catch (error: any) {
        // GPS no disponible en desarrollo
      }
    } else {
      // En producción, GPS debe estar disponible
      const hasPermission = await this.geo.checkPermissions();

      if (hasPermission) {
        try {
          await this.geo.getCurrentPosition();
          await this.geo.startWatchingPosition();
        } catch (error) {
          // Error iniciando GPS
        }
      }
    }
  }

  switchTab(tab: 'list' | 'map') {
    if (tab === 'map') {
      // Abrir Google Maps directamente
      this.abrirGoogleMaps();
    } else {
      this.activeTab = tab;
    }
  }

  /**
   * Abrir Google Maps con las direcciones de los clientes
   */
  abrirGoogleMaps() {
    const position = this.geo.currentPosition();
    const orders = this.orderService.orders();

    if (!position) {
      alert('No se pudo obtener tu ubicación actual');
      return;
    }

    if (!orders || orders.length === 0) {
      // Sin pedidos, solo mostrar ubicación actual
      const url = `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`;
      window.open(url, '_system');
      return;
    }

    // Extraer coordenadas de las direcciones de los clientes
    const clientCoordinates: { lat: number, lng: number }[] = [];
    
    for (const order of orders) {
      const deliveryData = order.json_datos_delivery?.p_header?.arrDatosDelivery;
      if (deliveryData) {
        const clientLat = parseFloat(deliveryData.direccionEnvioSelected?.latitude || '0');
        const clientLng = parseFloat(deliveryData.direccionEnvioSelected?.longitude || '0');
        
        if (clientLat && clientLng) {
          clientCoordinates.push({ lat: clientLat, lng: clientLng });
        }
      }
    }

    if (clientCoordinates.length === 0) {
      alert('No se encontraron direcciones de clientes');
      return;
    }

    // Generar URL para Google Maps
    const origin = `${position.coords.latitude},${position.coords.longitude}`;
    const destination = `${clientCoordinates[clientCoordinates.length - 1].lat},${clientCoordinates[clientCoordinates.length - 1].lng}`;

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    // Agregar waypoints si hay más de un cliente
    if (clientCoordinates.length > 1) {
      const waypoints = clientCoordinates
        .slice(0, -1)
        .slice(0, 9) // Google Maps permite máximo 9 waypoints
        .map(coord => `${coord.lat},${coord.lng}`)
        .join('|');
      url += `&waypoints=${waypoints}`;
    }

    window.open(url, '_system');
  }

  async toggleOnlineStatus() {
    const newStatus = await this.auth.toggleOnlineStatus();
    
    // Actualizar estado en socket
    this.socketService.updateOnlineStatus(newStatus);
  }

  toggleSideMenu() {
    this.isSideMenuOpen = !this.isSideMenuOpen;
  }

  getInitials(): string {
    const name = this.repartidorNombre || 'Repartidor';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  openChangePasswordModal() {
    this.isSideMenuOpen = false;
    this.isChangePasswordModalOpen = true;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordError = '';
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordError = '';
  }

  async changePassword() {
    this.passwordError = '';

    // Validaciones
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.passwordError = 'Todos los campos son obligatorios';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    if (this.passwordForm.currentPassword === this.passwordForm.newPassword) {
      this.passwordError = 'La nueva contraseña debe ser diferente a la actual';
      return;
    }

    this.isChangingPassword = true;

    try {
      const user = this.auth.currentUser();
      if (!user?.usuario?.idrepartidor) {
        this.passwordError = 'Usuario no identificado';
        return;
      }

      const response: any = await lastValueFrom(
        this.http.post('repartidor/set-cambio-pass-repartidor', {
          idrepartidor: user.usuario.idrepartidor,
          p2: this.passwordForm.newPassword
        })
      );

      if (response && response.success) {
        alert('Contraseña cambiada exitosamente');
        this.closeChangePasswordModal();
      } else {
        this.passwordError = response?.message || 'Error al cambiar la contraseña';
      }
    } catch (error: any) {
      this.passwordError = error?.error?.message || 'Error al cambiar la contraseña. Intenta de nuevo.';
    } finally {
      this.isChangingPassword = false;
    }
  }

  goToDeliveryReport() {
    this.isSideMenuOpen = false;
    // TODO: Navegar a la página de reporte de entregas cuando esté implementada
    alert('Funcionalidad de Reporte de Entregas próximamente');
  }

  logout() {
    this.geo.stopWatchingPosition();
    this.geo.stopSimulation(); // Stop simulation if running
    this.socketService.disconnect();
    this.auth.logout();
  }

  goToPendingOrders() {
    this.router.navigate(['/pending-orders-list']);
  }

  // ============================================
  // 🧪 GPS SIMULATION FOR DEVELOPMENT
  // ============================================

  /**
   * Start GPS simulation with first order's coordinates
   */
  startGPSSimulation() {
    const orders = this.orderService.orders();

    if (!orders || orders.length === 0) {
      return;
    }

    const firstOrder = orders[0];
    const deliveryData = firstOrder.json_datos_delivery?.p_header?.arrDatosDelivery;

    if (!deliveryData) {
      return;
    }

    const commerceLat = parseFloat(deliveryData.establecimiento?.latitude || '0');
    const commerceLng = parseFloat(deliveryData.establecimiento?.longitude || '0');
    const clientLat = parseFloat(deliveryData.direccionEnvioSelected?.latitude || '0');
    const clientLng = parseFloat(deliveryData.direccionEnvioSelected?.longitude || '0');

    if (!commerceLat || !commerceLng || !clientLat || !clientLng) {
      return;
    }

    this.geo.startSimulation(commerceLat, commerceLng, clientLat, clientLng);
  }

  /**
   * Stop GPS simulation
   */
  stopGPSSimulation() {
    this.geo.stopSimulation();
  }
}
