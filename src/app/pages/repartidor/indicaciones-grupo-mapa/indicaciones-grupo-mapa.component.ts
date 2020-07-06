import { Component, OnInit } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogOrdenDetalleComponent } from 'src/app/componentes/dialog-orden-detalle/dialog-orden-detalle.component';

@Component({
  selector: 'app-indicaciones-grupo-mapa',
  templateUrl: './indicaciones-grupo-mapa.component.html',
  styleUrls: ['./indicaciones-grupo-mapa.component.css']
})
export class IndicacionesGrupoMapaComponent implements OnInit {
  // _listPedidos: any;


  constructor(
    private dialog: MatDialog,
    private pedidoRepartidorService: PedidoRepartidorService,
  ) { }

  ngOnInit(): void {

    // this._listPedidos = JSON.parse(JSON.stringify(this.pedidoRepartidorService.getLocalItems()));
  }


  openDialogOrden(orden: any): void {
    const _dialogConfig = new MatDialogConfig();

    // marcador para que no cierrre como repartidor propio en orden detalle.
    orden.isRepartidorRed = true;

    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.width = '700px';
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.data = {
      laOrden: orden
    };

    // console.log('orden openDialogOrden', orden);
    this.pedidoRepartidorService.setPedidoSelect(orden);
    const dialogRef = this.dialog.open(DialogOrdenDetalleComponent, _dialogConfig);
  }

}
