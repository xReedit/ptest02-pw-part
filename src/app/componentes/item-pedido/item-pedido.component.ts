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

  DesPagarCon: string; // descripcion de pagar con
  constructor(
    public timerLimitService: TimerLimitService,
    private pedidoRepartidorService: PedidoRepartidorService,
  ) { }

  ngOnInit() {
    this.DesPagarCon = this.infoPedido.datosDelivery.metodoPago.idtipo_pago === 1 ?  `Pagar con efectivo.` : `El pedido ya esta pagado, solo recoger.`;
    this.showPedido();
  }

  showPedido() {
    this.timerLimitService.playCountTimerLimit();
  }

  // acepta asigna pedido
  aceptarPedido(): void {
    this.pedidoRepartidorService.asignarPedido();
    this.aceptaPedido.emit(true);
  }

}
