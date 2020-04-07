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
    private listenService: ListenStatusService
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
    .subscribe(res => {
      const pedido: PedidoRepartidorModel = new PedidoRepartidorModel;
      pedido.datosRepartidor = res[0];
      pedido.idpedido = res[1].idpedido;
      pedido.datosItems = res[1].dataItems;
      pedido.datosDelivery = res[1].dataDelivery;
      pedido.datosComercio = res[1].dataDelivery.establecimiento;
      pedido.datosCliente = res[1].dataDelivery.direccionEnvioSelected;
      pedido.datosSubtotales = res[1].dataDelivery.subTotales;
      pedido.datosSubtotalesShow = res[1].dataDelivery.subTotales;
      pedido.estado = 0;

      this.pedidoRepartidorService.setLocal(pedido);

      console.log('nuevo pedido resivido', res);
      console.log('nuevo pedido resivido', pedido);
      this.addPedidoToList(pedido);
      // this.listPedidos.push(pedido);
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

    console.log(pedido);
    this.pedidoRepartidorService.playAudioNewPedido();
  }

  aceptaPedido() {
    console.log('pedido acetpado');
    // this.router.navigate(['/', 'indicaciones']);
    this.router.navigate(['./repartidor/indicaciones']);
  }

  clickTab($event: any) {
    console.log('$event.index', $event.index);
    this._tabIndex = $event.index;
  }

  // showPedido() {
  //   this.timerLimitService.playCountTimerLimit();
  // }

}
