import { Injectable } from '@angular/core';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { RepartidorService } from './repartidor.service';
import { PedidoRepartidorService } from './pedido-repartidor.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class GpsUbicacionRepartidorService {
  geoPosition: GeoPositionModel = new GeoPositionModel;
  private key = 'sys::pos';


  private geoPositionNowSource = new BehaviorSubject<GeoPositionModel>(this.geoPosition);
  public geoPositionNow$ = this.geoPositionNowSource.asObservable();


  constructor(
    private repartidorService: RepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService
  ) {   }

  // activar geoposition
  onGeoPosition() {
    this.get();
    navigator.geolocation.getCurrentPosition((position: any) => {
      // const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
      this.geoPosition.latitude = position.coords.latitude;
      this.geoPosition.longitude = position.coords.longitude;
      this.geoPosition.hasPermition = true;
      this.set();
    }, this.showPositionError);
  }

  private susccesWatchPosition(pos: any) {
    // console.log('position actual', this.geoPosition);
    // console.log('position actual pos', pos);
    this.geoPositionNowSource.next(this.geoPosition);

    if ( this.geoPosition.latitude ===  pos.coords.latitude && this.geoPosition.longitude === pos.coords.longitude) {return; }
    this.geoPosition.latitude = pos.coords.latitude;
    this.geoPosition.longitude = pos.coords.longitude;
    this.set();


    // guarda en la bd // si el pedido aun no esta aceptado, si pedido esta en proceso de entrega no graba, porque es constante
    if ( this.pedidoRepartidorService.pedidoRepartidor.estado === 0 ) {
      this.repartidorService.guardarPositionActual(this.geoPosition);
    }
  }

  private errorWatchPosition(err: any) {
    // console.warn('ERROR(' + err.code + '): ' + err.message);
    console.log(err);
  }

  onGeoWatchPosition() {
    this.get();

    const options = {
      enableHighAccuracy: false,
      timeout: 120000,
      maximumAge: 0
    };
    navigator.geolocation.watchPosition(pos => this.susccesWatchPosition(pos), this.errorWatchPosition, options);
  }

  getGeoPosition(): GeoPositionModel {
    return this.geoPosition;
  }

  private showPositionError(error: any): void {
    // if ( error.PERMISSION_DENIED ) {
      this.geoPosition.hasPermition = false;
    // }
  }

  private set() {
    localStorage.setItem(this.key, JSON.stringify(this.geoPosition));
  }

  get(): GeoPositionModel {
    const _geoPosition = localStorage.getItem(this.key);
    this.geoPosition = _geoPosition ? <GeoPositionModel>JSON.parse(_geoPosition) : new GeoPositionModel;
    return this.geoPosition;
  }
}
