import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
import { Subscription } from 'rxjs/internal/Subscription';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy, AfterViewInit {
  efectivoMano = 0;
  pedidoRepartidor: PedidoRepartidorModel;
  listPedidos = [];
  listPedidosGroup = [];
  _tabIndex = 0;
  sumAcumuladoPagar = 0;

  yaQuitoPedido = 0;

  dataPedidos: any;

  private positionNow: GeoPositionModel;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private unsubscribeSocket = new Subscription();
  private unsubscribeSocketClearPedido = new Subscription();

  constructor(
    private infoTokenService: InfoTockenService,
    // public timerLimitService: TimerLimitService,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private router: Router,
    private listenService: ListenStatusService,
    public timerLimitService: TimerLimitService,
    private geoPositionService: GpsUbicacionRepartidorService,
    // private crudService: CrudHttpService,
    private repartidorServcice: RepartidorService
  ) { }

  ngOnInit() {
    this.efectivoMano = this.infoTokenService.infoUsToken.efectivoMano;
    this.listenService.setEfectivoMano(this.efectivoMano);


    // this.repartidorServcice.listenPedidosNuevos();
    // console.log('this.infoTokenService.infoUsToken', this.infoTokenService.infoUsToken);

    // this.listPedidos = new PedidoRepartidorModel[0];
  }

  ngAfterViewInit(): void {
    this.geoPositionService.onGeoPosition();

    // iniciar transmitir position
    this.geoPositionService.onGeoWatchPosition();


    this.listenPedidos();
  }

  ngOnDestroy(): void {
    this.unsubscribeSocket.unsubscribe();
    this.unsubscribeSocketClearPedido.unsubscribe();
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
    this.unsubscribeSocket = this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .subscribe((res: any) => {

      console.log('repartidor-get-pedido-pendiente-aceptar', res[0]);
      this.dataPedidos = res[0].pedido_por_aceptar;

      // this.pedidoRepartidorService.setPedidoPasoVa(res[0].pedido_paso_va);

      if ( this.dataPedidos === null || res[0].solicita_liberar_pedido === 1) {
        // console.log('clear pedidos');
        this.listPedidosGroup = [];
        this.pedidoRepartidorService.cleanLocal();
        this.timerLimitService.stopCountTimerLimit();
        return;
      }


      if ( this.dataPedidos ) {
        this.dataPedidos.pedido_paso_va = res[0].pedido_paso_va;
        this.yaQuitoPedido = 2;
        this.pedidoRepartidorService.setPedidoPasoVa(this.dataPedidos.pedido_paso_va);
        this.darFormatoGrupoPedidosRecibidos(this.dataPedidos);
      }

    });


    // opcion 2 // grupo de pedidos
    this.unsubscribeSocket = this.socketService.onRepartidorNuevoPedido()
    .subscribe((res: any) => {
      const pedidos = res[1];


      this.yaQuitoPedido = 1;
      this.pedidoRepartidorService.setPedidoPasoVa(0);
      // this.pedidoRepartidorService.setPedidoPasoVa(this.dataPedidos.pedido_paso_va);
      this.darFormatoGrupoPedidosRecibidos(pedidos);
    });


    this.unsubscribeSocketClearPedido = this.socketService.onRepartidorServerQuitaPedido()
    .subscribe((idpedido_res: any) => {
        if ( this.yaQuitoPedido === 1 ) {
          this.pedidoRepartidorService.setPedidoPasoVa(0);
          this.pedidoRepartidorService.setPasoVa(0);
          this.listPedidosGroup = [];
          this.pedidoRepartidorService.cleanLocal();
          this.timerLimitService.stopCountTimerLimit();
          this.yaQuitoPedido = 0;
        }
      // }
    });
  }

  private darFormatoGrupoPedidosRecibidos(pedidos: any) {
    if ( !pedidos ) {return; }
    this.sumAcumuladoPagar = pedidos.importe_pagar;
    this.pedidoRepartidorService.loadPedidosRecibidos(pedidos.pedidos.join(','))
        .subscribe((response: any) => {
          // console.log('res', response);

          // formateamos el json_}¿datos
          const _listAsignar = response.map(p => {
            p.json_datos_delivery = JSON.parse(p.json_datos_delivery);
            p.importe_pagar_comercio =  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.importeTotal) -  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery);
            p.importe_pagar_comercio = p.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.idtipo_pago === 2 ? 0 : p.importe_pagar_comercio;
            return p;
          });


          this.listPedidosGroup = JSON.parse(JSON.stringify(_listAsignar));

          this.pedidoRepartidorService.setLocalIds(pedidos);
          this.pedidoRepartidorService.setLocalItems( this.listPedidosGroup );

          this.pedidoRepartidorService.playAudioNewPedido();

        });
  }

  // private addPedidoToList(pedido: PedidoRepartidorModel): void {
  //   if ( !pedido.datosDelivery ) { return; }
  //   // console.log('pedido', pedido);
  //   if ( !pedido.conFormato ) {
  //     this.pedidoRepartidorService.darFormatoPedidoLocal(pedido.datosItems);

  //     const _arrTotal = this.pedidoRepartidorService.darFormatoSubTotales();
  //     pedido = this.pedidoRepartidorService.pedidoRepartidor;
  //     pedido.datosSubtotalesShow = _arrTotal;
  //     pedido.conFormato  = true; // indica que ya tiene formato
  //   }

  //   // this.pedidoRepartidorService.setLocal(pedido);
  //   this.listPedidos.push(pedido);

  //   // console.log(pedido);

  //   this.pedidoRepartidorService.playAudioNewPedido();
  // }

  aceptaPedido() {

    // pedido ya fue aceptado
    if (this.pedidoRepartidorService.pedidoRepartidor.aceptado ) {
      this.router.navigate(['./main/list-grupo-pedidos']);
      return;
    }

    this.positionNow = this.geoPositionService.get();
    // console.log('pedido acetpado');
    // this.router.navigate(['/', 'indicaciones']);
    // emitir pedido aceptado para comercio
    // const _dataPedido = {
      // idsede: this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede,
      // idpedido: this.pedidoRepartidorService.pedidoRepartidor.idpedido,
      this.dataPedidos.idrepartidor = this.infoTokenService.infoUsToken.usuario.idrepartidor,
      this.dataPedidos.nombre = this.infoTokenService.infoUsToken.usuario.nombre,
      this.dataPedidos.apellido = this.infoTokenService.infoUsToken.usuario.apellido,
      this.dataPedidos.telefono = this.infoTokenService.infoUsToken.usuario.telefono,
      this.dataPedidos.position_now = this.positionNow;
    // };

    // console.log('repartidor-acepta-pedido', this.dataPedidos);


    // notificamos al comercio que estos pedidos ya tienen repartidor
    this.socketService.emit('repartidor-acepta-pedido', this.dataPedidos);

    this.pedidoRepartidorService.pedidoRepartidor.aceptado = true;
    this.pedidoRepartidorService.setLocal();

    this.router.navigate(['./main/list-grupo-pedidos']);

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
