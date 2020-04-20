import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogEfectivoRepartidorComponent } from 'src/app/componentes/dialog-efectivo-repartidor/dialog-efectivo-repartidor.component';
import { SocketService } from 'src/app/shared/services/socket.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();


  constructor(
    private dialog: MatDialog,
    private socketService: SocketService,
    private repartidorService: RepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService
  ) { }

  ngOnInit() {
    // conecta a notificaciones
    this.pedidoRepartidorService.init();
    this.socketService.connect();

    // verificar si tenemos pedidos pendientes por aceptar
    this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      const _pedido = res[0].pedido_por_aceptar;
      console.log('onRepartidorGetPedidoPendienteAceptar', _pedido);
      if ( _pedido && !this.pedidoRepartidorService.pedidoRepartidor.idpedido) {
        this.pedidoRepartidorService.setLocal(_pedido);
        this.pedidoRepartidorService.init();
      }
    });
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
    } else {
      this.repartidorService.guardarEfectivo(0, 0);
    }

  }


}
