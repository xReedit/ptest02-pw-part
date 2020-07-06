import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { Observable } from 'rxjs/internal/Observable';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { SocketService } from './socket.service';
import { InfoTockenService } from './info-token.service';
import { ListenStatusService } from './listen-status.service';
import { Router } from '@angular/router';
import { SseService } from './sse.service';
import { PedidoRepartidorService } from './pedido-repartidor.service';


@Injectable({
  providedIn: 'root'
})
export class RepartidorService {
  private idSedeRepartidor;
  private idRepartidor;


  constructor(
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private infoToken: InfoTockenService,
    private listenService: ListenStatusService,
    private router: Router,
    private pedidoRepartidorService: PedidoRepartidorService,
    private sseService: SseService
  ) {

    this.idSedeRepartidor = this.infoToken.getInfoUs().usuario.idsede_suscrito;
    this.idRepartidor = this.infoToken.getInfoUs().usuario.idrepartidor;

  }

  // guarda efectivo inicial
  guardarEfectivo(importe: number, _online = 1) {
    const _data = {
      efectivo: importe,
      online: _online
    };

    this.crudService.postFree(_data, 'repartidor', 'set-efectivo-mano', true)
      .subscribe(res => {
        console.log('ya esta', res);
      });

    // if (  _online === 1  ) {
    //   this.crudService.getAll('repartidor', 'get-view-event-new-pedido', false, false, true)
    //   .subscribe(res => {
    //     console.log('get-view-event-new-pedido', res);
    //   });
    // }
  }

  // listenPedidosNuevos() {
  //   const idRepartidor = this.infoToken.infoUsToken.usuario.idrepartidor;
  //   this.sseService
  //     .getServerSentEvent('repartidor', 'get-view-event-new-pedido', false, idRepartidor)
  //     .subscribe(data => console.log(data));
  // }

  guardarPositionActual(_pos: GeoPositionModel) {
    const _data = {
      pos: _pos
    };

    this.crudService.postFree(_data, 'repartidor', 'set-position-now', true)
      .subscribe(res => {
      });

  }

  guardarPasoVa(_paso_va: number) {
    const _data = {
      paso_va: _paso_va
    };

    console.log('set-paso-pedido-va', _paso_va);
    this.crudService.postFree(_data, 'repartidor', 'set-paso-pedido-va', true)
      .subscribe(res => {
        console.log('.');
      });

  }

  // repartidor propio pedidos asignados
  getMisPedidosPropiosAsignados() {
    return new Observable(observer => {
    this.crudService.getAll('repartidor', 'get-repartidor-propio-mis-pedidos', false, false, true)
      .subscribe((res: any) => {
        observer.next(res.data);
      });
    });
  }

  // emitir posicion actual (comercio / cliente)
  emitPositionNow(_coordenadas, pedido: PedidoRepartidorModel = null, idsedeComercio = null) {
    // emitir a comercio
    const _idComercio = this.idSedeRepartidor ? this.idSedeRepartidor : this.pedidoRepartidorService.pedidoRepartidor ? this.pedidoRepartidorService.pedidoRepartidor.idsede : null;
    const _pedido = pedido ? pedido : this.pedidoRepartidorService.pedidoRepartidor;

    const _dataSend = {
      coordenadas : {
        latitude: _coordenadas.lat || _coordenadas.latitude,
        longitude: _coordenadas.lng || _coordenadas.longitude,
      },
      idrepartidor: this.idRepartidor,
      idcliente: _pedido?.datosCliente?.idcliente || null,
      idsede: idsedeComercio ? idsedeComercio : _idComercio,
      minuto: new Date().getMinutes() // para guadar position cada 2 minutos
    };

    console.log('repartidor-notifica-ubicacion', _dataSend);

    const geoposiionNow = new GeoPositionModel;
    geoposiionNow.latitude = _coordenadas.latitude;
    geoposiionNow.longitude = _coordenadas.longitude;

    this.listenService.setMyPosition(geoposiionNow);
    this.socketService.emit('repartidor-notifica-ubicacion', _dataSend);


  }

  cerrarSession() {
    this.guardarEfectivo(0, 0);
    this.socketService.closeConnection();
    localStorage.clear();
    this.router.navigate(['../']);
  }
}
