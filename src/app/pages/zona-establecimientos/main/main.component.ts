import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  infoClient: SocketClientModel;
  nomDireccionCliente = 'Establecer una direccion de entrega';
  isSelectedDireccion = false;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private dialogDireccion: MatDialog,
    private listenService: ListenStatusService,
    private router: Router,
    private socketService: SocketService,
  ) { }

  ngOnInit() {
    this.infoClient = this.verifyClientService.getDataClient();

    this.setDireccion(this.infoClient.direccionEnvioSelected);
    // console.log('this.infoToken', this.infoClient);

    // si no hay direccion abre el dialog
    setTimeout(() => {
      if ( !this.isSelectedDireccion ) {
        this.openDialogDireccion();
      }
    }, 800);


    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        // this.codigo_postal_actual = res.codigo;
        this.setDireccion(res);
      }
    });
  }

  // ngOnDestroy(): void {
  //   this.socketService.isSocketOpenReconect = true;
  //   this.socketService.closeConnection();
  // }

  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      panelClass: 'my-full-screen-dialog',
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.verifyClientService.setDireccionDeliverySelected(data);
        this.setDireccion(data);
      }
    );
  }

  setDireccion(direccion: DeliveryDireccionCliente) {
    if ( direccion ) {
      this.isSelectedDireccion = true;
      const _direccion = direccion.direccion.split(',');
      this.nomDireccionCliente = _direccion[0] + ' ' + _direccion[1];
      // this.listenService.setChangeDireccionDelivery(direccion);
    }
  }

  clickTab($event) {
    console.log($event);
    let goToPage = '/categorias';
    switch ($event.index) {
      case 0:
        goToPage = '/categorias';
        break;
      case 1:
        goToPage = '/pedidos';
        // this.router.navigate(['/mis-pedidos']);
        break;
      }

    this.router.navigate([`zona-delivery${goToPage}`]);
    // this.router.navigate([goToPage]);
  }

}
