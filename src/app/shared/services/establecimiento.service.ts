import { Injectable } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';

@Injectable({
  providedIn: 'root'
})
export class EstablecimientoService {
  establecimiento: DeliveryEstablecimiento;

  private keyStorage = 'sys::ed';
  constructor() { }

  set(_establecimiento: DeliveryEstablecimiento) {
    localStorage.setItem(this.keyStorage, btoa(JSON.stringify(_establecimiento)));
  }

  get(): DeliveryEstablecimiento {
    let _establecimiento = new DeliveryEstablecimiento;
    const _isExist = localStorage.getItem(this.keyStorage);
    _establecimiento = _isExist ? <DeliveryEstablecimiento>JSON.parse(atob(_isExist)) : _establecimiento;
    return _establecimiento;
  }
}
