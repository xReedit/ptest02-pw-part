import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../core/services/geolocation.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  
  constructor(
    public geo: GeolocationService,
    public orderService: OrderService
  ) {}

  ngOnInit() {
    // Obtener posición actual si no está disponible
    if (!this.geo.currentPosition()) {
      this.geo.getCurrentPosition().catch(err => {

      });
    }
  }

  /**
   * Navegar en Google Maps con las direcciones de los clientes
   */
  navegarEnGoogleMaps() {
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

}
