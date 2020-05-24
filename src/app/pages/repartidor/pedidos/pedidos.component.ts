import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
// import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy {
  efectivoMano = 0;
  pedidoRepartidor: PedidoRepartidorModel;
  listPedidos = [];
  _tabIndex = 0;

  private positionNow: GeoPositionModel;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    private infoTokenService: InfoTockenService,
    // public timerLimitService: TimerLimitService,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private router: Router,
    private listenService: ListenStatusService,
    public timerLimitService: TimerLimitService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private crudService: CrudHttpService
  ) { }

  ngOnInit() {
    this.efectivoMano = this.infoTokenService.infoUsToken.efectivoMano;
    this.listenService.setEfectivoMano(this.efectivoMano);

    console.log('this.infoTokenService.infoUsToken', this.infoTokenService.infoUsToken);

    // this.listPedidos = new PedidoRepartidorModel[0];
    this.listenPedidos();

    this.geoPositionService.onGeoPosition();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  listenPedidos() {

    // escuchar cambios en efectivo mano
    this.listenService.efectivoManoMano$.subscribe(res => {
        this.efectivoMano = res === 0 ? this.infoTokenService.infoUsToken.efectivoMano : res;
    });

    // si recarga la pagina chequea si existe pedido pendiente
    this.pedidoRepartidor = this.pedidoRepartidorService.pedidoRepartidor;
    // // if ( this.pedidoRepartidor.estado === 0 ) {
    //   this.addPedidoToList(this.pedidoRepartidor);
    // }

    // verificar si tenemos pedidos pendientes por aceptar
    this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      let _pedido = res[0].pedido_por_aceptar;
      // console.log('onRepartidorGetPedidoPendienteAceptar', _pedido);
      _pedido = this.pedidoRepartidorService.pedidoRepartidor.idpedido ? this.pedidoRepartidorService.pedidoRepartidor :  _pedido;
      // if ( _pedido && !this.pedidoRepartidorService.pedidoRepartidor.idpedido) {
        this.pedidoRepartidorService.darFormatoLocalPedidoRepartidorModel(_pedido);
        // this.pedidoRepartidorService.setLocal(_pedido);
        // this.pedidoRepartidorService.init();

        this.pedidoRepartidor = this.pedidoRepartidorService.pedidoRepartidor;

        this.addPedidoToList(this.pedidoRepartidor);
      // }
    });



    this.socketService.onRepartidorNuevoPedido()
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      let pedido: PedidoRepartidorModel = new PedidoRepartidorModel;
      // console.log('nuevo pedidos', res);
      if ( res[1]?.is_reasignado ) { // si es reasignado
        pedido = res[1];
      } else {
        pedido.datosRepartidor = res[0];
        pedido.idpedido = res[1].idpedido;
        // pedido.datosItems = res[1].dataItems || res[1].datosItem;
        // pedido.datosDelivery = res[1].dataDelivery || res[1].datosDelivery;
        pedido.datosItems = res[1].json_datos_delivery.p_body;
        pedido.datosDelivery = res[1].json_datos_delivery.p_header.arrDatosDelivery;
        pedido.datosComercio = pedido.datosDelivery.establecimiento;
        pedido.datosCliente = pedido.datosDelivery.direccionEnvioSelected;
        pedido.datosSubtotales = pedido.datosDelivery.subTotales;
        pedido.datosSubtotalesShow = pedido.datosDelivery.subTotales;
        pedido.estado = 0;
      }

      this.pedidoRepartidorService.setLocal(pedido);

      // console.log('nuevo pedido resivido', res);
      // console.log('nuevo pedido resivido', pedido);
      this.addPedidoToList(pedido);
      // this.listPedidos.push(pedido);
    });


    this.socketService.onRepartidorServerQuitaPedido()
    .pipe(takeUntil(this.destroy$))
    .subscribe((idpedido_res: any) => {
      // console.log('onRepartidorServerQuitaPedido', idpedido_res);
      if ( this.pedidoRepartidorService.pedidoRepartidor.idpedido === idpedido_res ) {
        this.listPedidos = [];
        // console.log('clean from onRepartidorServerQuitaPedido');
        this.pedidoRepartidorService.cleanLocal();
        this.timerLimitService.stopCountTimerLimit();
      }
    });
  }

  private addPedidoToList(pedido: PedidoRepartidorModel): void {
    if ( !pedido.datosDelivery ) { return; }
    console.log('pedido', pedido);
    if ( !pedido.conFormato ) {
      this.pedidoRepartidorService.darFormatoPedidoLocal(pedido.datosItems);

      const _arrTotal = this.pedidoRepartidorService.darFormatoSubTotales();
      pedido = this.pedidoRepartidorService.pedidoRepartidor;
      pedido.datosSubtotalesShow = _arrTotal;
      pedido.conFormato  = true; // indica que ya tiene formato
    }

    this.pedidoRepartidorService.setLocal(pedido);
    this.listPedidos.push(pedido);

    // console.log(pedido);

    this.pedidoRepartidorService.playAudioNewPedido();
  }

  aceptaPedido() {

    // pedido ya fue aceptado
    if (this.pedidoRepartidorService.pedidoRepartidor.aceptado ) {
      this.router.navigate(['./main/indicaciones']);
      return;
    }

    this.positionNow = this.geoPositionService.get();
    console.log('pedido acetpado');
    // this.router.navigate(['/', 'indicaciones']);
    // emitir pedido aceptado para comercio
    const _dataPedido = {
      idsede: this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede,
      idpedido: this.pedidoRepartidorService.pedidoRepartidor.idpedido,
      idrepartidor: this.infoTokenService.infoUsToken.usuario.idrepartidor,
      nombre: this.infoTokenService.infoUsToken.usuario.nombre,
      apellido: this.infoTokenService.infoUsToken.usuario.apellido,
      telefono: this.infoTokenService.infoUsToken.usuario.telefono,
      position_now: this.positionNow
    };

    console.log('repartidor-acepta-pedido', _dataPedido);

    this.socketService.emit('repartidor-acepta-pedido', _dataPedido);

    this.pedidoRepartidorService.pedidoRepartidor.aceptado = true;

    this.router.navigate(['./main/indicaciones']);

  }

  clickTab($event: any) {
    console.log('$event.index', $event.index);
    this._tabIndex = $event.index;
  }

  recargarPedido() {
    location.reload();
  }

  // showPedido() {
  //   this.timerLimitService.playCountTimerLimit();
  // }


  // peticion(op: number) {
  //   this.efectivoMano += 1;
  //   const putSend = {
  //     online: 1,
  //     efectivo: 100,
  //     estado: 1
  //   };
  //   switch (op) {
  //     case 1: // peticion get sin token
  //       this.crudService.getFree('https://app.restobar.papaya.com.pe/api.pwa/v3/comercio/get-sin-token').subscribe(res => console.log(res));
  //       break;
  //     case 2: // peticion get con token
  //       this.crudService.getAll('repartidor', 'get-sin-token', false, false, true).subscribe(res => console.log(res));
  //       break;
  //     case 3: // peticion put sin token
  //       // this.crudService.postFree(putSend, 'repartidor', 'set-sin-token', false).subscribe(res => console.log(res));
  //       this.crudService.getAll('pruebas', 'get-con-select-sin-token', false, false, true).subscribe(res => console.log(res));
  //       break;
  //     case 4: // peticion put con token
  //     this.crudService.postFree(putSend, 'pruebas', 'put-con-token', true).subscribe(res => console.log(res));
  //       break;
  //     default:
  //       break;
  //   }
  // }

}
