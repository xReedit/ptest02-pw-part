import { Component, OnInit } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { Router } from '@angular/router';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-pedido-detalle',
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.css']
})
export class PedidoDetalleComponent implements OnInit {
  infoPedido: any = {};
  indicacionesComprobante = '';
  comprobanteSolicitar = '';

  constructor(
    private repartidorPedidoService: PedidoRepartidorService,
    private infoTokenService: InfoTockenService,
    private router: Router
  ) { }

  ngOnInit() {

    let _dniRuc = '';
    let _otro = '';


    const _getPedidoSelectGroup = this.repartidorPedidoService.getPedidoSelect();
    if ( _getPedidoSelectGroup ) {
    this.infoPedido = _getPedidoSelectGroup; // this.infoTokenService.infoUsToken.usuario.idrepartidor;
    // this.infoPedido.idpedido = _getPedidoSelectGroup.idpedido;
    // this.infoPedido.idsede = _getPedidoSelectGroup.idsede;
    // this.infoPedido.idorg =  _getPedidoSelectGroup.idorg;
    const _dni = _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.dni ? _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.dni : '';
    _dniRuc = _dni === '' ? '' : _dni.length > 8 ? 'RUC ' : 'DNI ';
    _otro = _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.otro ? _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.otro : '';
    this.indicacionesComprobante = _dni === '' ? 'Publico en general.' :
                                    _dniRuc + ' ' + _dni + ' - ' + _otro;


    this.comprobanteSolicitar = _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.descripcion;
    return;
    }

    this.infoPedido = this.repartidorPedidoService.pedidoRepartidor;
    this.infoPedido.idpedido = this.repartidorPedidoService.pedidoRepartidor.idpedido;
    this.infoPedido.idsede = this.repartidorPedidoService.pedidoRepartidor.datosComercio.idsede;
    this.infoPedido.idorg = this.repartidorPedidoService.pedidoRepartidor.datosComercio.idorg;
    this.infoPedido.datosDelivery.tipoComprobante.dni = this.infoPedido.datosDelivery.tipoComprobante.dni ? this.infoPedido.datosDelivery.tipoComprobante.dni : '';
    _dniRuc = this.infoPedido.datosDelivery.tipoComprobante.dni === '' ? '' : this.infoPedido.datosDelivery.tipoComprobante.dni.length > 8 ? 'RUC ' : 'DNI ';
    _otro = this.infoPedido.datosDelivery.tipoComprobante.otro ? this.infoPedido.datosDelivery.tipoComprobante.otro : '';
    this.indicacionesComprobante = this.infoPedido.datosDelivery.tipoComprobante.dni === '' ? 'Publico en general.' :
                                    _dniRuc + ' ' + this.infoPedido.datosDelivery.tipoComprobante.dni + ' - ' + _otro;

  }

  goBack() {
    // window.history.back();
    this.router.navigate(['/main/list-grupo-pedidos']);
  }

}
