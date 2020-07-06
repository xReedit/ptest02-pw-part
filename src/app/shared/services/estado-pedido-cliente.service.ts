import { Injectable } from '@angular/core';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { ListenStatusService } from './listen-status.service';
import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';
import { JsonpInterceptor } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { timeInterval, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EstadoPedidoClienteService {
  estadoPedido = new EstadoPedidoModel();

  private keyStorage = 'sys::status';
  private timeInterval = null;
  private timeNow = new Date();
  private hayPedidoPendiente = false;

  private timeRestanteAproxSource = new BehaviorSubject<number>(0);
  public timeRestanteAprox$ = this.timeRestanteAproxSource.asObservable();

  private hayCuentaClienteSource = new BehaviorSubject<any>(null);
  public hayCuentaCliente$ = this.hayCuentaClienteSource.asObservable();

  private dataPost: any;

  constructor(
    private listenStatusService: ListenStatusService,
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService
  ) {

    this.deserializar();

    this.dataPost = {
      idsede: this.infoTokenService.getInfoUs().idsede,
      idcliente: this.infoTokenService.getInfoUs().idcliente
    };

    // this.listenStatusService.hayPedidoPendiente$.subscribe((res: boolean) => {
    //   console.log('======== listen setHayPedidoPendiente', res);
    //   this.setHayPedidoPendiente(res);
    // });
  }

  private deserializar(): void {
    let _data = localStorage.getItem(this.keyStorage);
    _data = _data === '{}' || '' ? null : _data;
    if ( _data ) {
      this.estadoPedido = JSON.parse(_data);
    } else {
      this.estadoPedido = new EstadoPedidoModel();
    }

  }

  get() {
    // const _data = localStorage.getItem(this.keyStorage);
    this.deserializar();
    // if ( !this.estadoPedido ) {
      // verificar en la bd si tiene pedido sin pagar
      this.getCuentaTotales();

    //  }
  }

  // solo para estado pedido al momento de hacer clic en ver cuenta se mostrara la cuenta getCuenta()
  getCuentaTotales(): number {

    let importeCuenta = 0;
    this.crudService.postFree(this.dataPost, 'pedido', 'lacuenta-cliente-totales', false).subscribe( (res: any) => {
      if ( res.data.length === 0 ) { this.estadoPedido.hayPedidoCliente = false; return; } // si no hay cuenta pedido del cliente
      importeCuenta = res.data[0].importe || 0;
      this.setImporte(importeCuenta);

      this.estadoPedido.hayPedidoCliente = true;
      this.calcTimeAprox(); // calcula el tiempo aproximado

      // this.setisPagada(importeCuenta === 0 ? true : false);
      // if (this.hayPedidoFromStorage) {
        // notificar pedido pediente por finalizar
        // return;
      // }
      // console.log('cuenta cliente totales', res);



      // la cuenta
      // this.hayCuentaClienteSource.next(res);
      this.notifyChange();
      // return res;
    });

    return importeCuenta;
  }

  getCuenta(): any {

    this.crudService.postFree(this.dataPost, 'pedido', 'lacuenta-cliente', false).subscribe( (res: any) => {
      if ( res.data.length === 0 ) { this.estadoPedido.hayPedidoCliente = false; return; } // si no hay cuenta pedido del cliente

      this.estadoPedido.hayPedidoCliente = true;
      this.calcTimeAprox(); // calcula el tiempo aproximado
      // console.log('cuenta cliente', res);


      // la cuenta
      this.hayCuentaClienteSource.next(res);
      this.notifyChange();
      return res;
    });
  }

  getImporteCuenta() {
    return new Promise(resolve => {
      this.crudService.postFree(this.dataPost, 'pedido', 'lacuenta-cliente-totales', false).subscribe( (res: any) => {
        const _rpt = res.success ? res.data[0].importe : 0;
        resolve(_rpt);
      });
    });
  }

  getObj(): EstadoPedidoModel {
    // const _data = localStorage.getItem(this.keyStorage);
    // this.estadoPedido = _data;
    if ( !this.estadoPedido ) {
      this.deserializar();
    }

    return this.estadoPedido;
  }

  setEstado(val: number): void {
    this.deserializar();
    this.estadoPedido.estado = val;
    this.notifyChange();
  }

  setImporte(val: number): void {
    this.deserializar();
    this.estadoPedido.importe = val;
    this.notifyChange();
  }

  setHoraInitPedido(val: number): void {
    this.deserializar();
    this.estadoPedido.horaInt = val;
    this.notifyChange();
  }

  setTimeAprox(val: boolean): void {
    this.deserializar();
    this.estadoPedido.isTiempoAproxCumplido = val;
    this.notifyChange();
  }

  setHayPedidoPendiente(val: boolean): void {
    this.deserializar();
    this.estadoPedido.hayPedidoClientePendiente = val;
    this.notifyChange();
  }

  setisPagada(val: boolean): void {
    this.deserializar();
    this.estadoPedido.isPagada = val;
    this.notifyChange();
  }

  setisRegisterPago(val: boolean): void {
    this.deserializar();
    this.estadoPedido.isRegisterOnePago = val;
    this.notifyChange();
  }

  // obtener el tiempo aproximado del pedido
  calcTimeAprox(): void {
    this.crudService.postFree(this.dataPost, 'pedido', 'calc-time-despacho', false).subscribe( (res: any) => {
      // console.log('calc time despacho', res);
      this.estadoPedido.estado = 0; // en espera
      this.estadoPedido.numMinAprox = res.data[0].rpt;
      // this.estadoPedido.horaInt = this.timeNow.getTime();
      this.estadoPedido.isTiempoAproxCumplido = false;
      this.notifyChange();

      // console.log('this.estadoPedido', this.estadoPedido);
      this.getTimeAprox();
    });
  }

  // calcula el tiempo
  getTimeAprox(): number {
    const rpt = 0;
    if ( this.estadoPedido.estado === 0 ) {
      // this.timeInterval = setInterval(this.calTimeMin, 4000);
      this.timeInterval = setTimeout(() => {
        let min = this.calTimeMin();
        if ( min <= 0 ) {
          this.estadoPedido.estado = 1;
          this.notifyChange();
          this.clearTimeout();
          clearTimeout(this.timeInterval);
          min = 0;
        } else {
          this.getTimeAprox();
        }

        this.timeRestanteAproxSource.next(min);
      }, 2000);
    } else {
      this.clearTimeout();
    }

    return rpt;
  }

  private calTimeMin(): number {
    let timeMin = new Date().getTime() - this.estadoPedido.horaInt;
    timeMin = Math.round(((timeMin % 86400000) % 3600000) / 60000);
    timeMin = this.estadoPedido.numMinAprox - timeMin;

    // let min = this.calTimeMin();
        // if ( timeMin <= 0 ) {
        //   this.estadoPedido.estado = 1;
        //   this.notifyChange();
        //   this.clearTimeout();
        //   timeMin = 0;
        // }

        // this.timeRestanteAproxSource.next(timeMin);

    return  isNaN(timeMin) ? 0 : timeMin;
  }

  private clearTimeout(): void {
    // if (this.timeInterval) {
      clearTimeout(this.timeInterval);
      this.timeInterval = null;
    // }
  }

  private notifyChange(): void {
    this.listenStatusService.setEstadoPedido(this.estadoPedido);

    localStorage.setItem(this.keyStorage, JSON.stringify(this.estadoPedido));

    // calcula el tiempo de espera aproximadamente
    // this.getTimeAprox();
  }
}
