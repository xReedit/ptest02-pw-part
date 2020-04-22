import { Component, OnInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogOrdenDetalleComponent } from 'src/app/componentes/dialog-orden-detalle/dialog-orden-detalle.component';

@Component({
  selector: 'app-mapa-pedidos',
  templateUrl: './mapa-pedidos.component.html',
  styleUrls: ['./mapa-pedidos.component.css']
})
export class MapaPedidosComponent implements OnInit {
  infoToken: UsuarioTokenModel;
  nomRepartidor = '';
  listPedidos: any;
  constructor(
    private infoTokenService: InfoTockenService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private repartidorService: RepartidorService
  ) { }

  ngOnInit(): void {
    this.infoToken = this.infoTokenService.getInfoUs();
    this.nomRepartidor = this.infoToken.usuario.nombre;
    console.log('this.infoToken', this.infoToken);

    this.loadPedidosPropios();

  }

  private loadPedidosPropios(): void {
    this.repartidorService.getMisPedidosPropiosAsignados()
      .subscribe((res: any) => {
        console.log('propios pedidos', res);
        res.map(x => {
          x.json_datos_delivery = JSON.parse(x.json_datos_delivery);
        });

        this.listPedidos = res;
      });
  }


  openDialogOrden(orden: any): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.width = '700px';
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.data = {
      laOrden: orden
    };

    const dialogRef = this.dialog.open(DialogOrdenDetalleComponent, _dialogConfig);

    // dialogRef.afterClosed().subscribe((ordenClose: any) => {
    //   if ( ordenClose ) {
    //     // if (ordenClose.pwa_estado !== 'P') {
    //       this.quitarOrden(ordenClose);
    //     // }
    //   }
    // });

  }

}
