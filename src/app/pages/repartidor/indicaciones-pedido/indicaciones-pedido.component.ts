import { Component, OnInit, OnDestroy } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/shared/services/socket.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-indicaciones-pedido',
  templateUrl: './indicaciones-pedido.component.html',
  styleUrls: ['./indicaciones-pedido.component.css']
})
export class IndicacionesPedidoComponent implements OnInit, OnDestroy {
  coordenadasDestino: any = {};
  descripcionPago: string;
  dataPedido: PedidoRepartidorModel;
  geoPositionActual: GeoPositionModel;
  importeEfectivoPedido = 0;
  btnTitlePasos = 'Empezar';
  btnIsVisible = true;
  btnTerminarVisible = false; // si el pedido ya fue cerrado pero no llego la notificacion socket
  _desAccionComprar = 'RECOGER'; // cuando es comercio afiliado. si no dira comprar.


  private radioUbicacionActiva = 60; // radio a la redonda // comercio 60 cliente 100
  private idSedeNotifiPos: number;
  private idClienteNotifyPos: number;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private pedidoRepartidorService: PedidoRepartidorService,
    private repartidorService: RepartidorService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private calcDistanciaService: CalcDistanciaService,
    private router: Router,
    private socketService: SocketService,
    private infoTokenService: InfoTockenService,
    private dialog: MatDialog,
    private timerService: TimerLimitService,
    private listenService: ListenStatusService
  ) { }

  ngOnInit() {

    // verificar estado del pedido
    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;
    this.pedidoRepartidorService.verificarEstadoPedido(this.pedidoRepartidorService.pedidoRepartidor.idpedido)
      .subscribe((res: number) => {
        this.dataPedido.estado = res;
        this.pedidoRepartidorService.setLocal();
        this.loadInit();
    });

    this.idClienteNotifyPos = this.dataPedido.datosCliente.idcliente;
    this.idSedeNotifiPos = this.dataPedido.datosComercio.idsede;

    this.dataPedido.datosDelivery.paga_con = this.dataPedido.datosDelivery.paga_con.replace('undefined', '');
    this._desAccionComprar = this.dataPedido.datosComercio.pwa_delivery_comision_fija_no_afiliado === 0 ? 'RECOGER' : 'COMPRAR';
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private loadInit(): void {
    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;

    if ( this.dataPedido.estado.toString() === '4' ) {
      this.btnTerminarVisible = true;
      this.dataPedido.paso_va = 4;
      this.pedidoRepartidorService.setPasoVa(4);
    }

    // solo desarrollo
    // this.dataPedido.paso_va = 2;

    switch (this.dataPedido.datosDelivery.metodoPago.idtipo_pago) {
      case 1:
        this.descripcionPago = `Pagar S/. ${ parseFloat(this.dataPedido.importePedido).toFixed(2)}`;
        this.importeEfectivoPedido = parseFloat(this.dataPedido.importePagaCliente);
        break;
      case 2:
        this.descripcionPago = `El pedido ya esta pagado, solo entregar.`;
        break;
      case 3: // yape
      this.descripcionPago = `Pagar S/. ${ parseFloat(this.dataPedido.importePedido).toFixed(2)}`;
        this.importeEfectivoPedido = parseFloat(this.dataPedido.importePagaCliente);
        break;
    }

    // if ( this.dataPedido.datosDelivery.metodoPago.idtipo_pago === 1 ) {
    //   this.descripcionPago = `Pagar en efectivo S/. ${ parseFloat(this.dataPedido.importePedido).toFixed(2)}`;
    //   // this.importeEfectivoPedido = parseFloat(this.dataPedido.importePedido) + parseFloat(this.dataPedido.c_servicio);
    //   this.importeEfectivoPedido = parseFloat(this.dataPedido.importePagaCliente);
    // } else {
    //   this.descripcionPago = `El pedido ya esta pagado, solo recoger.`;
    // }

    this.showPasos();
    setTimeout(() => {
      this.listenGeoPosition();
    }, 600);
  }

  private listenGeoPosition(): void {
    // iniciamos el gps
    // this.geoPositionService.onGeoWatchPosition();

    this.geoPositionActual = this.geoPositionService.geoPosition;
    // this.geoPositionService.geoPositionNow$.subscribe((res: GeoPositionModel) => {
    this.listenService.myPosition$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: GeoPositionModel) => {
      res = !res?.latitude ? this.geoPositionActual : res;
      if ( !res.latitude ) { return; }
      // verificar en que paso esta
      // si paso 1 verificar si se acerca al coordenadas destino y activar boton accion
      this.geoPositionActual = res;
      const isLLego = this.coordenadasDestino.latitude ? this.calcDistanciaService.calcDistancia(this.geoPositionActual, this.coordenadasDestino, this.radioUbicacionActiva) : false;
      // console.log('distancia listen llego ?', isLLego);
      // console.log('distancia listen this.radioUbicacionActiva ?', this.radioUbicacionActiva);

      // enviar posicion
      // const _data = {
      //   coordenadas : this.geoPositionActual,
      //   idcliente: this.pedidoRepartidorService.pedidoRepartidor.datosCliente.idcliente
      // };

      // this.repartidorService.emitPositionNow(this.geoPositionActual, this.dataPedido, this.idSedeNotifiPos);

      // this.socketService.emit('repartidor-notifica-ubicacion', _data);

      if ( isLLego ) {
        if ( this.dataPedido.paso_va === 1) {
          this.dataPedido.paso_va = 2;
          this.pedidoRepartidorService.setPasoVa(2);
          this.showPasos();
          // this.btnIsVisible = true;
          // this.btnTitlePasos = 'Empezar';
        }

        // si ya llego al lugar de entrega
        // if ( this.dataPedido.paso_va === 3) {
        //   this.dataPedido.paso_va = 4;
        //   this.pedidoRepartidorService.setPasoVa(4);
        //   this.showPasos();
        // }
      }

      if ( this.dataPedido.paso_va === 3) {
        this.dataPedido.paso_va = 4;
        this.pedidoRepartidorService.setPasoVa(4);
        this.showPasos();
      }


    });

    this.socketService.onDeliveryPedidoFin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        // lanzar calificacion al cliente
        // console.log('fin del pedido idrepartidor', res);
        this.openDialogCalificacion();
      });
  }


  private openDialogCalificacion() {
    if ( !this.dataPedido?.idpedido ) {return; } // cuando el cliente termina y ya el pedido ha sido terminiado por el repartidor

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
        this.timerService.stopCountTimerLimit();
        this.pedidoRepartidorService.finalizarPedido();
        // this.router.navigate(['./repartidor/pedidos']);
      }
    );
  }

  private showPasos(): void {
    this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;

    // console.log('this.dataPedido.paso_va', this.dataPedido.paso_va);

    // console.log(this.dataPedido);
    switch (this.dataPedido.paso_va) {
      case 1 || null:
        this.coordenadasDestino.latitude = this.dataPedido.datosComercio.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosComercio.longitude;
        this.btnTitlePasos = 'Empezar';
        this.radioUbicacionActiva = 350; // radio del cliente
        break;
      case 2: // apuntar a la direccion del cliente
        this.btnIsVisible = true;
        this.coordenadasDestino.latitude = this.dataPedido.datosCliente.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosCliente.longitude;
        this.btnTitlePasos = 'Paso 3 Empezar';
        this.radioUbicacionActiva = 350; // radio del cliente
        break;
      case 3: // ir a la direccion // si recarga ya no sale
        this.btnIsVisible = true;
        this.coordenadasDestino.latitude = this.dataPedido.datosCliente.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosCliente.longitude;
        this.btnTitlePasos = 'Paso 3 Empezar';
        this.radioUbicacionActiva = 350; // radio del cliente
        break;
      case 4: //
        this.btnIsVisible = true;
        this.coordenadasDestino.latitude = this.dataPedido.datosCliente.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosCliente.longitude;
        this.radioUbicacionActiva = 350; // radio del cliente
        this.btnTitlePasos = 'Entregado, terminar.';
        break;
      default:
        this.coordenadasDestino.latitude = this.dataPedido.datosCliente.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosCliente.longitude;
        break;
    }
  }

  btnEjecutar() {
    let linkGPS = '';
    switch (this.dataPedido.paso_va) {
      case 1:
        linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
        window.open(linkGPS, '_blank');
        this.btnIsVisible = false;
        // this.btnTitlePasos = 'Llegue';
        // this.pedidoRepartidorService.setPasoVa(2);
        break;
      case 2: // apuntar a la direccion del cliente
        linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
        window.open(linkGPS, '_blank');
        this.btnIsVisible = false;
        // this.btnTitlePasos = 'Llegue';
        this.dataPedido.paso_va = 3;
        this.pedidoRepartidorService.setPasoVa(3);
        break;
      case 3: // apuntar a la direccion del cliente
        linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
        window.open(linkGPS, '_blank');
        this.btnIsVisible = false;
        // this.btnTitlePasos = 'Llegue';
        this.dataPedido.paso_va = 3;
        this.pedidoRepartidorService.setPasoVa(3);
        break;
      case 4: // terminar pedido / solo si la notificacion socket no llego // o si el cliente no termino el pedido
        this.openDialogCalificacion();
        break;
    }

    this.socketEmitEstadoPedido(this.dataPedido.paso_va);
  }

  showDetallePedido() {
    if ( this.dataPedido.paso_va >= 2 ) {
      this.router.navigate(['./main/pedido-detalle']);
    }
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.dataPedido.datosDelivery.telefono}`;
    window.open(_link, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.dataPedido.datosDelivery.telefono}`);
  }

  private socketEmitEstadoPedido(_estado: number): void {
    const _data = {
      idcliente: this.dataPedido.datosCliente.idcliente,
      idpedido: this.dataPedido.idpedido,
      estado: _estado
    };

    this.socketService.emit('repartidor-notifica-estado-pedido', _data);
  }

}
