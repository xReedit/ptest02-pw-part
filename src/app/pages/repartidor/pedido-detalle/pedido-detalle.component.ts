import { Component, OnInit } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pedido-detalle',
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.css']
})
export class PedidoDetalleComponent implements OnInit {
  infoPedido: any = {};
  indicacionesComprobante = '';

  constructor(
    private repartidorPedidoService: PedidoRepartidorService,
    private router: Router
  ) { }

  ngOnInit() {
    this.infoPedido = this.repartidorPedidoService.pedidoRepartidor;
    this.infoPedido.idpedido = this.repartidorPedidoService.pedidoRepartidor.idpedido;
    this.infoPedido.idsede = this.repartidorPedidoService.pedidoRepartidor.datosComercio.idsede;
    this.infoPedido.idorg = this.repartidorPedidoService.pedidoRepartidor.datosComercio.idorg;
    this.infoPedido.datosDelivery.tipoComprobante.dni = this.infoPedido.datosDelivery.tipoComprobante.dni ? this.infoPedido.datosDelivery.tipoComprobante.dni : '';
    const _dniRuc = this.infoPedido.datosDelivery.tipoComprobante.dni === '' ? '' : this.infoPedido.datosDelivery.tipoComprobante.dni.length > 8 ? 'RUC ' : 'DNI ';
    const _otro = this.infoPedido.datosDelivery.tipoComprobante.otro ? this.infoPedido.datosDelivery.tipoComprobante.otro : '';
    this.indicacionesComprobante = this.infoPedido.datosDelivery.tipoComprobante.dni === '' ? 'Publico en general.' :
                                    _dniRuc + ' ' + this.infoPedido.datosDelivery.tipoComprobante.dni + ' - ' + _otro;

  }

  goBack() {
    // window.history.back();
    this.router.navigate(['/main/indicaciones']);
  }

}
