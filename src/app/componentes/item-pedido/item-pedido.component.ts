import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';


@Component({
  selector: 'app-item-pedido',
  templateUrl: './item-pedido.component.html',
  styleUrls: ['./item-pedido.component.css']
})
export class ItemPedidoComponent implements OnInit {

  @Input() infoPedido: PedidoRepartidorModel;
  @Output() aceptaPedido = new EventEmitter<boolean>(false);

  estadoPedido = 0;
  DesPagarCon: string; // descripcion de pagar con
  constructor(
    public timerLimitService: TimerLimitService,
    private pedidoRepartidorService: PedidoRepartidorService,
  ) { }

  ngOnInit() {
    // this.DesPagarCon = this.infoPedido.datosDelivery.metodoPago.idtipo_pago === 1 ?  `Pagar con efectivo.` : `El pedido ya esta pagado, solo recoger.`;

    switch (this.infoPedido.datosDelivery.metodoPago.idtipo_pago) {
      case 1:
        this.DesPagarCon = 'Pagar con efectivo';
        break;
      case 2:
        this.DesPagarCon = 'El pedido ya esta pagado, solo recoger.';
        break;
      case 3: // yape
        this.DesPagarCon = 'El cliente pagara con Yape.';
        break;
    }

    this.estadoPedido = this.infoPedido.estado;
    this.showPedido();
  }

  showPedido() {
    if ( this.estadoPedido === 0 ) {
      this.timerLimitService.isPlayTimer = false;
      this.timerLimitService.playCountTimerLimit();

      // fin timer // busca otro repartidor
      this.timerLimitService.isTimeLimitComplet$.subscribe(res => {
        if (res) {
          if ( this.estadoPedido === 0 ) {
            // this.pedidoRepartidorService.pedidoNoAceptadoReasingar();
            this.timerLimitService.stopCountTimerLimit();
            this.infoPedido = null;
            this.pedidoRepartidorService.cleanLocal();
          }
          // console.log('termina tiempo reasigna pedido repartidor-declina-pedido', this.infoPedido);
          // const _num_reasignado = this.infoPedido.num_reasignado ? this.infoPedido.num_reasignado + 1 : 0;
          // this.infoPedido.num_reasignado = _num_reasignado === 0 ? 1 : _num_reasignado;
          // this.socketService.emit('repartidor-declina-pedido', this.infoPedido);
        }
      });
    }

  }

  // acepta asigna pedido
  aceptarPedido(): void {
    if  ( this.estadoPedido === 0 ) {
      this.estadoPedido = 1;
      this.infoPedido.estado = 1;
      this.pedidoRepartidorService.asignarPedido();
    }
    this.aceptaPedido.emit(true);
  }

}
