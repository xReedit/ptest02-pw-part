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

  private destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    private infoTokenService: InfoTockenService,
    // public timerLimitService: TimerLimitService,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private router: Router,
    private listenService: ListenStatusService,
    public timerLimitService: TimerLimitService,
  ) { }

  ngOnInit() {
    this.efectivoMano = this.infoTokenService.infoUsToken.efectivoMano;
    this.listenService.setEfectivoMano(this.efectivoMano);

    console.log('this.infoTokenService.infoUsToken', this.infoTokenService.infoUsToken);

    // this.listPedidos = new PedidoRepartidorModel[0];
    this.listenPedidos();
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
    // if ( this.pedidoRepartidor.estado === 0 ) {
      this.addPedidoToList(this.pedidoRepartidor);
    // }

    this.socketService.onRepartidorNuevoPedido()
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      let pedido: PedidoRepartidorModel = new PedidoRepartidorModel;
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

      console.log('nuevo pedido resivido', res);
      console.log('nuevo pedido resivido', pedido);
      this.addPedidoToList(pedido);
      // this.listPedidos.push(pedido);
    });


    this.socketService.onRepartidorServerQuitaPedido()
    .pipe(takeUntil(this.destroy$))
    .subscribe((idpedido_res: any) => {
      console.log('onRepartidorServerQuitaPedido', idpedido_res);
      if ( this.pedidoRepartidorService.pedidoRepartidor.idpedido === idpedido_res ) {
        this.listPedidos = [];
        this.pedidoRepartidorService.cleanLocal();
        this.timerLimitService.stopCountTimerLimit();
      }
    });
  }

  private addPedidoToList(pedido: PedidoRepartidorModel): void {
    if ( !pedido.datosDelivery ) { return; }
    this.pedidoRepartidorService.darFormatoPedidoLocal(pedido.datosItems);

    const _arrTotal = this.pedidoRepartidorService.darFormatoSubTotales();
    pedido = this.pedidoRepartidorService.pedidoRepartidor;
    pedido.datosSubtotalesShow = _arrTotal;
    this.pedidoRepartidorService.setLocal(pedido);
    this.listPedidos.push(pedido);

    // console.log(pedido);

    this.pedidoRepartidorService.playAudioNewPedido();
  }

  aceptaPedido() {
    console.log('pedido acetpado');
    // this.router.navigate(['/', 'indicaciones']);
    this.router.navigate(['./repartidor/indicaciones']);

    // emitir pedido aceptado para comercio
    const _dataPedido = {
      idsede: this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede,
      idpedido: this.pedidoRepartidorService.pedidoRepartidor.idpedido,
      idrepatidor: this.infoTokenService.infoUsToken.usuario.idrepatidor,
      nombre: this.infoTokenService.infoUsToken.usuario.nombre,
      apellido: this.infoTokenService.infoUsToken.usuario.apellido,
      telefono: this.infoTokenService.infoUsToken.usuario.telefono,
    };

    console.log('repartidor-acepta-pedido', _dataPedido);

    this.socketService.emit('repartidor-acepta-pedido', _dataPedido);
  }

  clickTab($event: any) {
    console.log('$event.index', $event.index);
    this._tabIndex = $event.index;
  }

  // showPedido() {
  //   this.timerLimitService.playCountTimerLimit();
  // }

}
