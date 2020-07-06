import { Component, OnInit, Input } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogImgItemComponent } from '../dialog-img-item/dialog-img-item.component';

@Component({
  selector: 'app-comp-pedido-detalle',
  templateUrl: './comp-pedido-detalle.component.html',
  styleUrls: ['./comp-pedido-detalle.component.css']
})
export class CompPedidoDetalleComponent implements OnInit {
  @Input() infoPedido: any;

  _miPedido: any;
  _arrSubtotales: any;

  @Input() showAllSubtotal = true;

  constructor(
    private crudService: CrudHttpService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.loadPedido();
  }

  private loadPedido() {
    // console.log('this.infoPedido', this.infoPedido);
    // console.log('infoPedido componente', this.infoPedido);
    // const _data = {
    //   mesa: 0,
    //   idsede: this.infoPedido.idsede,
    //   idorg: this.infoPedido.idorg,
    //   idpedido: this.infoPedido.idpedido
    // };

    // this.crudService.postFree(_data, 'pedido', 'lacuenta')
    //   .subscribe(res => {
    //     console.log(res);
    //     this._miPedido = this.pedidoRepartidorService.darFormatoPedido(res);

    //     this._arrSubtotales = this.pedidoRepartidorService.pedidoRepartidor.datosSubtotales;
    //     console.log('this._arrSubtotales', this._arrSubtotales);
    //     console.log('this.elPedido', this._miPedido);
    //   });

    console.log('ini service pedido');
    // this.pedidoRepartidorService.init();
    const isPedidoInGroup = this.pedidoRepartidorService.getPedidoSelect() ? true : false;
    const _getPedidoSelectGroup = this.pedidoRepartidorService.getPedidoSelect() || this.pedidoRepartidorService.pedidoRepartidor;
    // _getPedidoSelectGroup = _getPedidoSelectGroup ? _getPedidoSelectGroup : this.pedidoRepartidorService.pedidoRepartidor;
    const datosItems = isPedidoInGroup ? _getPedidoSelectGroup.json_datos_delivery.p_body : this.pedidoRepartidorService.pedidoRepartidor.datosItems;
    const comercio_paga_entrega = isPedidoInGroup ? _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.pwa_delivery_comercio_paga_entrega : null;
    const costo_servicio = isPedidoInGroup ? _getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery : null;

    // muestra subtotales lo que va a pagar en el comercio
    const datosSubtotalesComercio = isPedidoInGroup ?
          this.pedidoRepartidorService.darFormatoSubTotales(_getPedidoSelectGroup.json_datos_delivery.p_header.arrDatosDelivery.subTotales, comercio_paga_entrega, costo_servicio) :
          this.pedidoRepartidorService.pedidoRepartidor.datosSubtotalesShow;

    this._miPedido = this.pedidoRepartidorService.darFormatoPedidoLocal(datosItems, datosSubtotalesComercio);

    // muestra todos los subtotales
    const datosSubtotalesShow = isPedidoInGroup ? _getPedidoSelectGroup.json_datos_delivery.p_subtotales  : this.pedidoRepartidorService.pedidoRepartidor.datosSubtotalesShow;

    this._arrSubtotales = this.showAllSubtotal ? datosSubtotalesShow : datosSubtotalesComercio;
  }

  showImg(item: any) {
    if ( !item.img || item.img === '') {return; }

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = {
      item: item
    };

    this.dialog.open(DialogImgItemComponent, _dialogConfig);
  }

}
