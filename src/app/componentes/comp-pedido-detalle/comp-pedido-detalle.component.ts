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

  constructor(
    private crudService: CrudHttpService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.loadPedido();
  }

  private loadPedido() {
    console.log('this.infoPedido', this.infoPedido);
    console.log('infoPedido componente', this.infoPedido);
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

    this._miPedido = this.pedidoRepartidorService.darFormatoPedidoLocal(this.pedidoRepartidorService.pedidoRepartidor.datosItems);
    this._arrSubtotales = this.pedidoRepartidorService.pedidoRepartidor.datosSubtotalesShow;
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
