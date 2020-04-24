import { Component, OnInit, OnDestroy } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogOrdenDetalleComponent } from 'src/app/componentes/dialog-orden-detalle/dialog-orden-detalle.component';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';

@Component({
  selector: 'app-mapa-pedidos',
  templateUrl: './mapa-pedidos.component.html',
  styleUrls: ['./mapa-pedidos.component.css']
})
export class MapaPedidosComponent implements OnInit, OnDestroy {
  infoToken: UsuarioTokenModel;
  nomRepartidor = '';
  listPedidos: any;
  dataPedido: PedidoRepartidorModel;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private infoTokenService: InfoTockenService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private repartidorService: RepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService
  ) { }

  ngOnInit(): void {
    this.infoToken = this.infoTokenService.getInfoUs();
    this.nomRepartidor = this.infoToken.usuario.nombre;
    console.log('this.infoToken', this.infoToken);

    this.loadPedidosPropios();
    this.listenNewPedidos();

  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private listenNewPedidos(): void {
    // escuchar pedidos nuevos asignados por el comercio
    this.socketService.onPedidoAsignadoFromComercio()
    // .pipe(takeUntil(this.destroy$))
    .subscribe(pedido => {
      console.log('nuevo pedido asignado');
      this.loadPedidosPropios();
      this.pedidoRepartidorService.playAudioNewPedido();
    });

    this.socketService.onDeliveryPedidoFin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((pedidoFin: PedidoRepartidorModel) => {
        // lanzar calificacion al cliente
        console.log('fin del pedido', pedidoFin);
        this.openDialogCalificacion(pedidoFin);
      });
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
  }


  private openDialogCalificacion(_pedido: PedidoRepartidorModel = null) {
    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;
    const dataCalificado: DatosCalificadoModel = new DatosCalificadoModel;
    dataCalificado.idrepartidor = this.infoTokenService.infoUsToken.usuario.idrepartidor;
    dataCalificado.idcliente = this.dataPedido.datosCliente.idcliente;
    dataCalificado.idpedido = this.dataPedido.idpedido;
    dataCalificado.tipo = 2;
    dataCalificado.showNombre = true;
    dataCalificado.nombre = this.dataPedido.datosDelivery.nombre;
    dataCalificado.titulo = 'Como calificas al cliente?';
    dataCalificado.showTitulo = true;
    dataCalificado.showMsjTankyou = true;


    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    _dialogConfig.data = {
      dataCalificado: dataCalificado
    };

    const dialogRef =  this.dialog.open(DialogCalificacionComponent, _dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        // notificar al repartidor fin del pedido
        // this.timerService.stopCountTimerLimit();
        this.pedidoRepartidorService.finalizarPedidoPropioRepartidor();
        // this.router.navigate(['./repartidor/pedidos']);
      }
    );
  }

}
