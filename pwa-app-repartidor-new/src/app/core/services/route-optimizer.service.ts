import { Injectable } from '@angular/core';

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
  type: 'delivery' | 'current';
  order?: any;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number;
  orderedPoints: RoutePoint[];
}

@Injectable({
  providedIn: 'root'
})
export class RouteOptimizerService {

  constructor() { }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Optimiza la ruta usando el algoritmo del vecino más cercano (Nearest Neighbor)
   * Este algoritmo no es perfecto pero es rápido y da resultados razonables
   */
  optimizeRoute(currentPosition: { lat: number, lng: number }, deliveryPoints: RoutePoint[]): OptimizedRoute {
    if (deliveryPoints.length === 0) {
      return {
        points: [],
        totalDistance: 0,
        orderedPoints: []
      };
    }

    if (deliveryPoints.length === 1) {
      return {
        points: deliveryPoints,
        totalDistance: this.calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          deliveryPoints[0].lat,
          deliveryPoints[0].lng
        ),
        orderedPoints: deliveryPoints
      };
    }

    // Algoritmo del vecino más cercano
    const unvisited = [...deliveryPoints];
    const route: RoutePoint[] = [];
    let currentLat = currentPosition.lat;
    let currentLng = currentPosition.lng;
    let totalDistance = 0;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        currentLat,
        currentLng,
        unvisited[0].lat,
        unvisited[0].lng
      );

      // Encontrar el punto más cercano
      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          currentLat,
          currentLng,
          unvisited[i].lat,
          unvisited[i].lng
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Agregar el punto más cercano a la ruta
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearest);
      totalDistance += nearestDistance;

      // Actualizar posición actual
      currentLat = nearest.lat;
      currentLng = nearest.lng;
    }

    return {
      points: deliveryPoints,
      totalDistance,
      orderedPoints: route
    };
  }

  /**
   * Genera URL para abrir en Google Maps con waypoints optimizados
   */
  generateGoogleMapsUrl(currentPosition: { lat: number, lng: number }, orderedPoints: RoutePoint[]): string {
    if (orderedPoints.length === 0) {
      return `https://www.google.com/maps/search/?api=1&query=${currentPosition.lat},${currentPosition.lng}`;
    }

    const origin = `${currentPosition.lat},${currentPosition.lng}`;
    const destination = `${orderedPoints[orderedPoints.length - 1].lat},${orderedPoints[orderedPoints.length - 1].lng}`;

    if (orderedPoints.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }

    // Waypoints intermedios (máximo 9 waypoints en Google Maps API)
    const waypoints = orderedPoints
      .slice(0, -1)
      .slice(0, 9)
      .map(p => `${p.lat},${p.lng}`)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }

  /**
   * Extrae coordenadas de un pedido
   */
  extractDeliveryCoordinates(order: any): { commerce: { lat: number, lng: number } | null, client: { lat: number, lng: number } | null } {
    try {
      const deliveryData = order.json_datos_delivery?.p_header?.arrDatosDelivery;
      
      if (!deliveryData) {
        return { commerce: null, client: null };
      }

      const commerceLat = parseFloat(deliveryData.establecimiento?.latitude || '0');
      const commerceLng = parseFloat(deliveryData.establecimiento?.longitude || '0');
      const clientLat = parseFloat(deliveryData.direccionEnvioSelected?.latitude || '0');
      const clientLng = parseFloat(deliveryData.direccionEnvioSelected?.longitude || '0');

      return {
        commerce: (commerceLat && commerceLng) ? { lat: commerceLat, lng: commerceLng } : null,
        client: (clientLat && clientLng) ? { lat: clientLat, lng: clientLng } : null
      };
    } catch (error) {

      return { commerce: null, client: null };
    }
  }

  /**
   * Determina qué destino mostrar según el estado del pedido
   * - Si no llegó al comercio: mostrar comercio
   * - Si llegó al comercio pero no entregó: mostrar cliente
   */
  getTargetDestination(order: any): { lat: number, lng: number, label: string } | null {
    const coords = this.extractDeliveryCoordinates(order);
    const timeline = order.time_line;

    // Si no hay timeline o no llegó al comercio, ir al comercio
    if (!timeline || !timeline.llego_comercio) {
      return coords.commerce ? { ...coords.commerce, label: `Comercio - Pedido #${order.idpedido}` } : null;
    }

    // Si ya llegó al comercio pero no entregó, ir al cliente
    if (timeline.llego_comercio && !timeline.entrego_cliente) {
      return coords.client ? { ...coords.client, label: `Cliente - Pedido #${order.idpedido}` } : null;
    }

    // Si ya entregó, no mostrar este pedido
    return null;
  }
}
