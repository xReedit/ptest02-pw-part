import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogEfectivoRepartidorComponent } from 'src/app/componentes/dialog-efectivo-repartidor/dialog-efectivo-repartidor.component';
import { SocketService } from 'src/app/shared/services/socket.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { Subject } from 'rxjs/internal/Subject';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();


  isRepartidorPropio = false;
  showPanelLeft = false;

  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    private repartidorService: RepartidorService,
    private infoTokeService: InfoTockenService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private router: Router
  ) { }

  ngOnInit() {
    // conecta a notificaciones
    this.pedidoRepartidorService.init();
    this.isRepartidorPropio = this.infoTokeService.infoUsToken.usuario.idsede_suscrito;
    this.infoTokeService.infoUsToken.usuario.isRepartidorPropio = this.isRepartidorPropio;
    this.infoTokeService.set();

    this.socketService.connect();



    if ( this.isRepartidorPropio ) {
      this.router.navigate(['/repartidor/mapa-de-pedidos']);
    } else {
      this.router.navigate(['/repartidor/pedidos']);
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }


  repartidorOnLine(value: boolean) {
    if ( value ) {
      const _dialogConfig = new MatDialogConfig();
      _dialogConfig.disableClose = true;
      _dialogConfig.hasBackdrop = true;

      this.dialog.open(DialogEfectivoRepartidorComponent, _dialogConfig);
      this.socketService.connect();
    }
    // else {
    //   // this.repartidorService.guardarEfectivo(0, 0);
    // }


  }


  cerrarSession() {
    this.repartidorService.guardarEfectivo(0, 0);
    this.socketService.closeConnection();
    this.router.navigate(['../']);
  }

  openPanelLeft(val: any) {
    this.showPanelLeft = true;
  }


}
