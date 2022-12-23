import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { TimeLinePedido } from 'src/app/modelos/time.line.pedido';


@Component({
  selector: 'app-item-pedido',
  templateUrl: './item-pedido.component.html',
  styleUrls: ['./item-pedido.component.css']
})
export class ItemPedidoComponent implements OnInit, OnChanges  {

  @Input() listPedidos: any;
  @Input() importeAcumuladoPagar: any;
  // @Input() infoPedido: PedidoRepartidorModel;
  // @Output() aceptaPedido = new EventEmitter<boolean>(false);
  @Output() aceptaPedido = new EventEmitter<any>();

  estadoPedido = 0;
  countPedidos = 0;
  sumGananciaTotal = 0;
  sumKmRecorrer = 0;
  isHayPropina = false;
  DesPagarCon: string; // descripcion de pagar con
  establecimientoOrden: DeliveryEstablecimiento;
  elRepartidor: any;

  constructor(
    public timerLimitService: TimerLimitService,
    public pedidoRepartidorService: PedidoRepartidorService,
    public infoToken: InfoTockenService,
    public socketService: SocketService
  ) { }

  ngOnChanges() {
    // create header using child_id
    this.elRepartidor = this.infoToken.getInfoUs().usuario;
    console.log(this.listPedidos);
    // this.extraerListaClientePedido();
  }

  ngOnInit() {
    // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    this.elRepartidor = this.infoToken.getInfoUs().usuario;
    console.log('this.elRepartidor', this.elRepartidor);
    this.leerInfoGroup();
  }

  private leerInfoGroup() {
    this.pedidoRepartidorService.init();
    // console.log('this.pedidoRepartidorService.pedidoRepartidor', this.pedidoRepartidorService.pedidoRepartidor);

    this.estadoPedido = this.pedidoRepartidorService.pedidoRepartidor.estado ? this.pedidoRepartidorService.pedidoRepartidor.estado : this.listPedidos[0].estado;
    this.countPedidos = this.listPedidos.length;
    this.establecimientoOrden = this.listPedidos[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;

    this.listPedidos.map((p: any) => {
      const propina = p.json_datos_delivery.p_header.arrDatosDelivery.propina.value ? parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.propina.value) : 0;
      this.sumGananciaTotal += parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery) + propina;
      this.sumKmRecorrer += parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.c_km);
      this.sumKmRecorrer = isNaN(this.sumKmRecorrer) ? 0 : this.sumKmRecorrer;
      
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
    this.aceptaPedido.emit(this.establecimientoOrden);

    this.extraerListaClientePedido();
  }

  private extraerListaClientePedido() {
    const listClienteNotificar = [];
    this.listPedidos.filter(p => !p.idrepartidor ).map(p => {
      const rowDatos = p?.json_datos_delivery?.p_header?.arrDatosDelivery;
      // hora que acepta el pedido
      let _time_line = p.time_line || new TimeLinePedido()
      _time_line.hora_acepta_pedido = new Date().getTime()

      if ( rowDatos ) {
        const rowCliente = {
          nombre: rowDatos.nombre.split(' ')[0],
          telefono: rowDatos.telefono,
          establecimiento: rowDatos.establecimiento.nombre,
          idpedido: p.idpedido,
          repartidor_nom: this.elRepartidor.nombre.split(' ')[0],
          repartidor_telefono: this.elRepartidor.telefono,
          idsede: rowDatos.establecimiento.idsede,
          idorg: rowDatos.establecimiento.idorg,
          time_line: _time_line
        };

        listClienteNotificar.push(rowCliente);
      }
    });

    console.log('listClienteNotificar', listClienteNotificar);

    if ( listClienteNotificar.length > 0 ) {
      this.socketService.emit('repartidor-notifica-cliente-acepto-pedido', listClienteNotificar);
    }
  }

}
