import { Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogEfectivoRepartidorComponent } from 'src/app/componentes/dialog-efectivo-repartidor/dialog-efectivo-repartidor.component';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    // conecta a notificaciones
    this.socketService.connect();
  }


  repartidorOnLine(value: boolean) {
    if ( !value ) {return; }
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    this.dialog.open(DialogEfectivoRepartidorComponent, _dialogConfig);

    this.socketService.connect();
  }
}
