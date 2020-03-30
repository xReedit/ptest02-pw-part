import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
// import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy {
  efectivoMano = 0;
  pedidoRepartidor: PedidoRepartidorModel;
  listPedidos = [];

  private destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    private infoTokenService: InfoTockenService,
    // public timerLimitService: TimerLimitService,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private router: Router
  ) { }

  ngOnInit() {
    this.efectivoMano = this.infoTokenService.infoUsToken.efectivoMano;

    // this.listPedidos = new PedidoRepartidorModel[0];
    this.listenPedidos();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  listenPedidos() {

    // si recarga la pagina chequea si existe pedido pendiente
    this.pedidoRepartidor = this.pedidoRepartidorService.pedidoRepartidor;
    // if ( this.pedidoRepartidor.estado === 0 ) {
      this.addPedidoToList(this.pedidoRepartidor);
    // }

    this.socketService.onRepartidorNuevoPedido()
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      const pedido: PedidoRepartidorModel = new PedidoRepartidorModel;
      pedido.idpedido = res[1].idpedido;
      pedido.datosDelivery = res[1].dataDelivery;
      pedido.datosComercio = res[1].dataDelivery.establecimiento;
      pedido.datosCliente = res[1].dataDelivery.direccionEnvioSelected;
      pedido.datosSubtotales = res[1].dataDelivery.subTotales;
      pedido.estado = 0;

      this.pedidoRepartidorService.setLocal(pedido);

      console.log('nuevo pedido resivido', res);
      console.log('nuevo pedido resivido', pedido);
      this.addPedidoToList(pedido);
      // this.listPedidos.push(pedido);
    });
  }

  private addPedidoToList(pedido: PedidoRepartidorModel): void {
    pedido.datosSubtotales = this.pedidoRepartidorService.darFormatoSubTotales(pedido.datosDelivery.subTotales);
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

  // showPedido() {
  //   this.timerLimitService.playCountTimerLimit();
  // }

}
