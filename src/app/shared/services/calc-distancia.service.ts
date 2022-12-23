import { Injectable } from '@angular/core';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import {
  insideCircle,
  distanceTo
} from 'geolocation-utils';


@Injectable({
  providedIn: 'root'
})
export class CalcDistanciaService {
  directionsService = new google.maps.DirectionsService();
  // private directionsDisplay = new google.maps.DirectionsRenderer();

  private origin = {};
  private destination = {};


  constructor() { }


  calculateRoute(dirCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento): any {
    let c_servicio = dirEstablecimiento.c_minimo;
    const c_km = dirEstablecimiento.c_km; // costo x km adicional

    // cordenadas
    this.origin = {
      lat: dirCliente.latitude, lng: dirCliente.longitude
    };

    this.destination = {
      lat: dirEstablecimiento.latitude, lng: dirEstablecimiento.longitude
    };

    const request = {
      origin: this.origin,
      destination: this.destination,
      travelMode: google.maps.TravelMode.DRIVING
    };

    let km = 0;
    this.directionsService.route(request, (result: any, status) => {
      if (status === 'OK') {
        // this.directionsRenderer.setDirections(result);
        km = result.routes[0].legs[0].distance.value;
        km = parseInt((km / 1000).toFixed(), 0);

        if ( km > 1 ) {
          c_servicio = (( km - 1 ) * c_km) + c_servicio;
          dirEstablecimiento.c_servicio = c_servicio;
          // return c_servicio;
        }

        // console.log('km calc', km);
        // console.log(result.routes[0].legs[0]);
        // console.log('c_servicio', c_servicio);
        // console.log('dirEstablecimiento', dirEstablecimiento);
        // return c_servicio;
        // callback(c_servicio);
      }
    });

    setTimeout(() => {
      dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
    }, 500);

    dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
  }


  // retorna true si esta cerca
  calcDistancia(coordOrigen: GeoPositionModel, coordDetino: GeoPositionModel, radius: number = 100): boolean {
    coordDetino.latitude = typeof coordDetino.latitude === 'string' ? parseFloat(coordDetino.latitude) : coordDetino.latitude;
    coordDetino.longitude = typeof coordDetino.longitude === 'string' ? parseFloat(coordDetino.longitude) : coordDetino.longitude;
    const center = {lat: coordDetino.latitude, lon: coordDetino.longitude };
    // const radius = 75; // meters
    return insideCircle({lat: coordOrigen.latitude, lon: coordOrigen.longitude}, center, radius);  // false
  }

  calcDistanciaEnMetros(coordOrigen: GeoPositionModel, coordDetino: GeoPositionModel): Number {
    coordDetino.latitude = typeof coordDetino.latitude === 'string' ? parseFloat(coordDetino.latitude) : coordDetino.latitude;
    coordDetino.longitude = typeof coordDetino.longitude === 'string' ? parseFloat(coordDetino.longitude) : coordDetino.longitude;
    const _from = {lat: coordOrigen.latitude, lon: coordOrigen.longitude };
    const _to = {lat: coordDetino.latitude, lon: coordDetino.longitude };
    // const radius = 75; // meters
    return distanceTo(_from, _to);  // false
  }

  //radio metros
  isUbicationIntroRadio(coords1, coords2, radio = 10) {
    const _rptDistance = this.calculateDistanceInMt(coords1, coords2);
    return _rptDistance <= radio ? true : false;
  }

  calculateDistanceInMt(coords1, coords2) {
    const lat1 = coords1.latitude;
    const lng1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lng2 = coords2.longitude;

    // Calcular la distancia utilizando la fórmula de distancia entre dos puntos en un plano cartesiano
    const distance = Math.atan2(
      Math.sqrt(
        Math.pow(Math.cos(lat2) * Math.sin(lng2 - lng1), 2) +
        Math.pow(Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1), 2)
      ),
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
    ) * 6371;

    // Devolver la distancia en metros
    return distance * 1000;
  }

  // regla x km adicional
  private reglaKm() {

  }
}

