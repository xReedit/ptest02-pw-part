import { Component, OnInit, Output, EventEmitter } from '@angular/core';
// import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
// import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-tool-bar-repartidor',
  templateUrl: './tool-bar-repartidor.component.html',
  styleUrls: ['./tool-bar-repartidor.component.css']
})
export class ToolBarRepartidorComponent implements OnInit {
  @Output() public changeTogle = new EventEmitter<boolean>(false);

  isTogleActive = false;
  constructor(
    private infoTokenService: InfoTockenService,
    // private socketService: SocketService
  ) { }

  ngOnInit() {
    this.isTogleActive = this.infoTokenService.infoUsToken.isOnline;
    // this.changeTogle.emit(this.isTogleActive);
    // if ( this.isTogleActive ) {
    //   this.socketService.connect();
    // }
  }

  repartidorOnLine($event: any) {
    this.isTogleActive = $event.checked;
    this.infoTokenService.setisOnline(this.isTogleActive);
    this.changeTogle.emit(this.isTogleActive);
  }

  // repartidorOnLine() {
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;

  //   const dialogReset = this.dialog.open(DialogEfectivoRepartidorComponent, _dialogConfig);
  // }

}
