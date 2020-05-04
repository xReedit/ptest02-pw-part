import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { Observable } from 'rxjs/internal/Observable';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { SocketService } from './socket.service';
import { InfoTockenService } from './info-token.service';

@Injectable({
  providedIn: 'root'
})
export class RepartidorService {
  private idSedeRepartidor;
  private idRepartidor;
  constructor(
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private infoToken: InfoTockenService
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
  }

  guardarPositionActual(_pos: GeoPositionModel) {
    const _data = {
      pos: _pos
    };

    this.crudService.postFree(_data, 'repartidor', 'set-position-now', true)
      .subscribe(res => {
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
  emitPositionNow(_coordenadas, pedido: PedidoRepartidorModel, idsedeComercio = null) {
    const _dataSend = {
      coordenadas : {
        latitude: _coordenadas.lat || _coordenadas.latitude,
        longitude: _coordenadas.lng || _coordenadas.longitude,
      },
      idrepartidor: this.idRepartidor,
      idcliente: pedido?.datosCliente?.idcliente || null,
      idsede: idsedeComercio ? idsedeComercio : this.idSedeRepartidor
    };

    // console.log('repartidor-notifica-ubicacion', _dataSend);

    this.socketService.emit('repartidor-notifica-ubicacion', _dataSend);


  }
}
