import { Component, OnInit, Output, EventEmitter } from '@angular/core';
// import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { TemplateBindingParseResult } from '@angular/compiler';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-tool-bar-repartidor',
  templateUrl: './tool-bar-repartidor.component.html',
  styleUrls: ['./tool-bar-repartidor.component.css']
})
export class ToolBarRepartidorComponent implements OnInit {
  @Output() public changeTogle = new EventEmitter<boolean>(false);
  @Output() public openMenuLateral = new EventEmitter<boolean>(false);

  isTogleActive = false;
  isRepartidorPropio = false;

  estadoOnline = 'En linea';

  nomRepatidor = '';
  constructor(
    private infoTokenService: InfoTockenService,
    private repartidorService: RepartidorService,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.isTogleActive = this.infoTokenService.infoUsToken.isOnline;
    this.isRepartidorPropio = this.infoTokenService.infoUsToken.usuario.idsede_suscrito;
    this.estadoOnline = this.isRepartidorPropio ? 'En linea'  : this.isTogleActive ? 'En linea' : 'Fuera de linea';

    // console.log(this.infoTokenService.infoUsToken.usuario);
    this.nomRepatidor = this.infoTokenService.infoUsToken.usuario.nombre + ' ' + this.infoTokenService.infoUsToken.usuario.apellido;
    // this.changeTogle.emit(this.isTogleActive);
    // if ( this.isTogleActive ) {
    this.socketService.connect();
    // }

    if ( this.isRepartidorPropio ) {
      this.infoTokenService.setisOnline(this.isTogleActive);
    }
  }

  repartidorOnLine($event: any) {
    this.isTogleActive = $event.checked;
    this.infoTokenService.setisOnline(this.isTogleActive);
    this.changeTogle.emit(this.isTogleActive);

    this.estadoOnline = 'En linea';

    if ( !this.isTogleActive ) {
      this.estadoOnline = 'Fuera de linea';
      this.repartidorService.guardarEfectivo(0, 0);

      this.socketService.emit('notifica-repartidor-ofline', '');
    } else {

      this.socketService.emit('notifica-repartidor-online', '');
    }
  }

  abrirMenuLateral() {
    // console.log('this.openMenuLateral', true);
    this.openMenuLateral.emit(true);
  }

  // repartidorOnLine() {
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;

  //   const dialogReset = this.dialog.open(DialogEfectivoRepartidorComponent, _dialogConfig);
  // }

}
