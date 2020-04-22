import { Component, OnInit, Output, EventEmitter } from '@angular/core';
// import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
// import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-tool-bar-repartidor',
  templateUrl: './tool-bar-repartidor.component.html',
  styleUrls: ['./tool-bar-repartidor.component.css']
})
export class ToolBarRepartidorComponent implements OnInit {
  @Output() public changeTogle = new EventEmitter<boolean>(false);

  isTogleActive = false;
  isRepartidorPropio = false;
  constructor(
    private infoTokenService: InfoTockenService,
    private repartidorService: RepartidorService
    // private socketService: SocketService
  ) { }

  ngOnInit() {
    this.isTogleActive = this.infoTokenService.infoUsToken.isOnline;
    this.isRepartidorPropio = this.infoTokenService.infoUsToken.usuario.idsede_suscrito;
    // this.changeTogle.emit(this.isTogleActive);
    // if ( this.isTogleActive ) {
    //   this.socketService.connect();
    // }

    if ( this.isRepartidorPropio ) {
      this.infoTokenService.setisOnline(this.isTogleActive);
    }
  }

  repartidorOnLine($event: any) {
    this.isTogleActive = $event.checked;
    this.infoTokenService.setisOnline(this.isTogleActive);
    this.changeTogle.emit(this.isTogleActive);

    if ( !this.isTogleActive ) {
      this.repartidorService.guardarEfectivo(0, 0);
    }
  }

  // repartidorOnLine() {
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;

  //   const dialogReset = this.dialog.open(DialogEfectivoRepartidorComponent, _dialogConfig);
  // }

}
