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
  onGeoPosition(saveBdPositionInit: boolean = false) {
    this.get();
    navigator.geolocation.getCurrentPosition((position: any) => {
      // const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
      this.geoPosition.latitude = position.coords.latitude;
      this.geoPosition.longitude = position.coords.longitude;
      this.geoPosition.hasPermition = true;
      this.set();


      // guarda en la bd su posicion actual
      if ( saveBdPositionInit ) {
        this.repartidorService.guardarPositionActual(this.geoPosition);
      }

    }, this.showPositionError);
  }

  private susccesWatchPosition(pos: any) {
    // console.log('onGeoWatchPosition');
    // console.log('position actual', this.geoPosition);
    // console.log('position actual pos', pos);
    this.geoPositionNowSource.next(this.geoPosition);

    if ( this.geoPosition.latitude ===  pos.coords.latitude && this.geoPosition.longitude === pos.coords.longitude) {return; }
    this.geoPosition.latitude = pos.coords.latitude;
    this.geoPosition.longitude = pos.coords.longitude;
    this.set();


    // emitimos la position al comercio cliente y central
    this.repartidorService.emitPositionNow(this.geoPosition);

    // guarda en la bd // si el pedido aun no esta aceptado, si pedido esta en proceso de entrega no graba, porque es constante
    // -- no aplica tiene que guardar no mas -- para que el comercio sepa su position inicial

    // ahora va a guardar cada 2 minutos
    console.log('transmitiendo pos');
    const _mLastPos = this.getMinLastNotificationPosition();
    const _mMinNow =  new Date().getMinutes();
    if ( _mLastPos !== _mMinNow ) {
      if ( _mMinNow % 2 === 0 ) {
        console.log('save transmitiendo pos');
        this.setMinLastNotificationPosition();
        this.repartidorService.guardarPositionActual(this.geoPosition);
      }
    }
  }

  private errorWatchPosition(err: any) {
    // console.warn('ERROR(' + err.code + '): ' + err.message);
    console.log('error gps', err);
  }

  private setMinLastNotificationPosition() {
    localStorage.setItem('sys::last:m:pos', new Date().getMinutes().toString());
  }

  private getMinLastNotificationPosition() {
    const _m = localStorage.getItem('sys::last:m:pos');
    return _m ? parseInt(_m, 0) : 2;
    // localStorage.setItem('sys::last:m:pos', new Date().getMinutes().toString());
  }

  onGeoWatchPosition() {
    this.get();

    const options = {
      enableHighAccuracy: false,
      timeout: 7000, // cada 7 segundos notifica position
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

  set() {
    localStorage.setItem(this.key, JSON.stringify(this.geoPosition));
  }

  get(): GeoPositionModel {
    const _geoPosition = localStorage.getItem(this.key);
    this.geoPosition = _geoPosition ? <GeoPositionModel>JSON.parse(_geoPosition) : new GeoPositionModel;
    return this.geoPosition;
  }
}
