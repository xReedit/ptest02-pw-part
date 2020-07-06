import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';


@Component({
  selector: 'app-item-pedido',
  templateUrl: './item-pedido.component.html',
  styleUrls: ['./item-pedido.component.css']
})
export class ItemPedidoComponent implements OnInit, OnChanges  {

  @Input() listPedidos: any;
  @Input() importeAcumuladoPagar: any;
  // @Input() infoPedido: PedidoRepartidorModel;
  @Output() aceptaPedido = new EventEmitter<boolean>(false);

  estadoPedido = 0;
  countPedidos = 0;
  sumGananciaTotal = 0;
  sumKmRecorrer = 0;
  isHayPropina = false;
  DesPagarCon: string; // descripcion de pagar con
  establecimientoOrden: DeliveryEstablecimiento;

  constructor(
    public timerLimitService: TimerLimitService,
    public pedidoRepartidorService: PedidoRepartidorService,
  ) { }

  ngOnChanges() {
    // create header using child_id
    console.log(this.listPedidos);
  }

  ngOnInit() {
    // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    this.leerInfoGroup();
  }

  private leerInfoGroup() {
    this.pedidoRepartidorService.init();
    console.log('this.pedidoRepartidorService.pedidoRepartidor', this.pedidoRepartidorService.pedidoRepartidor);

    this.estadoPedido = this.pedidoRepartidorService.pedidoRepartidor.estado ? this.pedidoRepartidorService.pedidoRepartidor.estado : this.listPedidos[0].estado;
    this.countPedidos = this.listPedidos.length;
    this.establecimientoOrden = this.listPedidos[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;

    this.listPedidos.map((p: any) => {
      this.sumGananciaTotal += parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery) + parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.propina.value);
      this.sumKmRecorrer += parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.c_km);
      if ( !this.isHayPropina ) {
        this.isHayPropina = p.json_datos_delivery.p_header.arrDatosDelivery.propina.value > 0;
      }
    });

    this.pedidoRepartidorService.pedidoRepartidor.sumGananciaTotal = this.sumGananciaTotal;
    this.pedidoRepartidorService.setLocal();

    this.showPedido();
  }

  showPedido() {
    // if ( this.estadoPedido === 0 ) {
    if ( this.pedidoRepartidorService.pedidoRepartidor.pedido_paso_va === 0 ) {
      this.timerLimitService.isPlayTimer = false;
      this.timerLimitService.playCountTimerLimit();

      // fin timer // busca otro repartidor
      this.timerLimitService.isTimeLimitComplet$.subscribe(res => {
        if (res) {
          if ( this.estadoPedido === 0 ) {
            // this.pedidoRepartidorService.pedidoNoAceptadoReasingar();
            this.timerLimitService.stopCountTimerLimit();
            // this.infoPedido = null;
            // console.log('clean from showPedido');
            // this.pedidoRepartidorService.cleanLocal();
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
    // if  ( this.estadoPedido === 0 ) {
    if ( this.pedidoRepartidorService.pedidoRepartidor.pedido_paso_va === 0 ) {
      this.estadoPedido = 1;
      this.pedidoRepartidorService.pedidoRepartidor.pedido_paso_va = 1;
      this.pedidoRepartidorService.setPedidoPasoVa(1);
      // this.infoPedido.estado = 1;
    }

    this.pedidoRepartidorService.asignarPedido();
    this.pedidoRepartidorService.pedidoRepartidor.aceptado = true;
    this.aceptaPedido.emit(true);
  }

}
