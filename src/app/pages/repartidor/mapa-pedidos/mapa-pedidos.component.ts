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
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { Router } from '@angular/router';

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
  sumListPedidos = 0;
  sumGananciaTotal = 0;

  listRepartidoresInformativo: any = [];
  isShowResumen = false;

  timerRun: any;
  scanCode = false;
  loadingScan = false;
  isResulScan = false;
  ordenAsingadaScan: any;
  isEntregadoAll = false;
  isRepartidorRed = false;

  establecimientoIni: any;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  geoPositionActual: GeoPositionModel = new GeoPositionModel();

  displayedColumns: string[] = ['Pedido', 'Cliente', 'Importe'];

  constructor(
    private infoTokenService: InfoTockenService,
    private utilService: UtilitariosService,
    private socketService: SocketService,
    private dialog: MatDialog,
    private repartidorService: RepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private gpsPositionService: GpsUbicacionRepartidorService,
    private listeService: ListenStatusService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.infoToken = this.infoTokenService.getInfoUs();
    console.log('this.infoToken lista pedidos', this.infoToken);
    this.isRepartidorRed = !this.infoToken.usuario.idsede_suscrito;
    this.nomRepartidor = this.infoToken.usuario.nombre + ' ' + this.infoToken.usuario.apellido;

    this.loadPedidosPendiente();
    this.listenNewPedidos();

    // si es repartidor de la red
    // va de frente a escanear
    console.log('this.isRepartidorRed', this.isRepartidorRed);
    this.scanCode = this.isRepartidorRed;

    // console.log('this.infoToken', this.infoToken);

    // activar gps - obtener ubicacion actual y guardar
    // this.positionInt();


    // this.loadPedidosPropios();
    // this.listenNewPedidos();

    this.geoPositionService.onGeoWatchPosition();
    this.geoPositionActual = this.geoPositionService.geoPosition;
    this.geoPositionService.geoPositionNow$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: GeoPositionModel) => {
      res = !res?.latitude ? this.geoPositionActual : res;
      if ( !res.latitude ) { return; }
      // verificar en que paso esta
      // si paso 1 verificar si se acerca al coordenadas destino y activar boton accion
      this.geoPositionActual = res;
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  loadPedidosPendiente() {
    // const pendientes = this.pedidoRepartidorService.getPedidoPorAceptar();
    // this.darFormatoGrupoPedidosRecibidos(pendientes);

    this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .subscribe((res: any) => {
      console.log(res);
      this.pedidoRepartidorService.setPedidoPorAceptar(res[0].pedido_por_aceptar);
      this.darFormatoGrupoPedidosRecibidos(res[0].pedido_por_aceptar);
      this.pedidoRepartidorService.setPedidoPorAceptar(res[0].pedido_por_aceptar);
    });
  }

  succesScan($event: any) {
    this.loadingScan = true;
    this.pedidoRepartidorService.confirmarAsignacionReadBarCode($event)
    .subscribe((res: any) => {
      this.loadingScan = false;
      this.isResulScan = true;
      this.ordenAsingadaScan = res.elPedido;
      console.log(res);
      this.darFormatoGrupoPedidosRecibidos(res.pedidos_repartidor);
      console.log(res);
    });
  }

  private darFormatoGrupoPedidosRecibidos(pedidos: any) {    
    if ( !pedidos ) {return; }
    const sumAcumuladoPagar = pedidos.importe_pagar;
    this.pedidoRepartidorService.loadPedidosRecibidos(pedidos.pedidos.join(','))
        .subscribe((response: any) => {
          console.log('res', response);

          // formateamos el json_}¿datos
          let importeTotalPedido;
          const _listAsignar = response.map(p => {
            p.json_datos_delivery = JSON.parse(p.json_datos_delivery);
            // extraemos el importe total, sino de los subtotales -> venta rapida
            importeTotalPedido  = parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.importeTotal);
            importeTotalPedido = importeTotalPedido === 0 ? parseFloat(p.json_datos_delivery.p_subtotales[p.json_datos_delivery.p_subtotales.length - 1 ].importe ) : importeTotalPedido;

            p.importe_pagar_comercio =  parseFloat(importeTotalPedido) -  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery);
            p.importe_pagar_comercio = p.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.idtipo_pago === 2 ? 0 : p.importe_pagar_comercio;

            const propina = p.json_datos_delivery.p_header.arrDatosDelivery.propina.value ? parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.propina.value) : 0;
            p.comsion_entrea_total = parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery) + propina;
            return p;
          });

          this.establecimientoIni = _listAsignar[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
          this.establecimientoIni.longitude = parseFloat(this.establecimientoIni.longitude);
          this.establecimientoIni.latitude = parseFloat(this.establecimientoIni.latitude);


          const listPedidosGroup = JSON.parse(JSON.stringify(_listAsignar));

          this.pedidoRepartidorService.setLocalIds(pedidos);
          this.pedidoRepartidorService.setLocalItems( listPedidosGroup );

          // this.pedidoRepartidorService.playAudioNewPedido();

          this.iniComponente();

        });
  }

  private iniComponente() {

    this.pedidoRepartidorService.init();
    this.dataPedido = this.pedidoRepartidorService.getLocal();

    // load dlista
    this.listPedidos = this.pedidoRepartidorService.getLocalItems();

    // ordenar po distancia
    this.listPedidos = this.listPedidos
        .sort(( a, b ) => parseFloat(a.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km) - parseFloat(b.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km));

    //
    this.checkIsEntregaALL();

    // this.comercioPedido = this.listPedidos[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
    this.dataPedido.idsede  = this.listPedidos[0].idsede; // idsede del grupo de pedidos

    this.pedidoRepartidorService.setLocal();

    // ubicacion comercio
    // this.geoPositionComercio.latitude = typeof this.comercioPedido.latitude === 'string'  ? parseFloat(this.comercioPedido.latitude) : this.comercioPedido.latitude;
    // this.geoPositionComercio.longitude = typeof this.comercioPedido.longitude === 'string'  ? parseFloat(this.comercioPedido.longitude) : this.comercioPedido.longitude;

    // sumar total a pagar
    this.sumListPedidos = this.listPedidos.map( p => p.importe_pagar_comercio).reduce((a, b) => a + b, 0);
    this.sumGananciaTotal = this.listPedidos.map( p => p.comsion_entrea_total).reduce((a, b) => a + b, 0);
    // this.sumGananciaTotal = this.dataPedido.sumGananciaTotal;

    // this.showPasos();
    this.calcHora();
  }

  private calcHora() {
    this.calHoraList();
    this.timerRun = setInterval(() => {this.calHoraList(); }, 60000);
  }

  private calHoraList() {
    this.listPedidos.map(p => {
      p.hora_show = this.utilService.xTiempoTranscurridos_en_minutos(p.hora);
    });
  }

  showDetallePedido(orden: any): void {
    const _dialogConfig = new MatDialogConfig();

    // marcador para que no cierrre como repartidor propio en orden detalle.
    orden.isRepartidorRed = true;

    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.width = '700px';
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.data = {
      laOrden: orden
    };

    // console.log('orden openDialogOrden', orden);
    this.pedidoRepartidorService.setPedidoSelect(orden);
    const dialogRef = this.dialog.open(DialogOrdenDetalleComponent, _dialogConfig);
    dialogRef.afterClosed().subscribe(
      pedido => {
        console.log('el pedido', pedido);
        this.checkIsEntregaALL();

        if ( pedido.pwa_estado === 'E' ) {
          this.openDialogCalificacion(pedido);
        }
      }
    );
  }

  private checkIsEntregaALL() {
    const _res = this.listPedidos.filter(p => p.pwa_estado !== 'E');
    this.isEntregadoAll = _res.length === 0;
  }


  // private positionInt() {
  //   this.gpsPositionService.onGeoPosition(true);
  // }

  private listenNewPedidos(): void {
    // escuchar pedidos nuevos asignados por el comercio
    this.socketService.onPedidoAsignadoFromComercio()
    // .pipe(takeUntil(this.destroy$))
      .subscribe(pedido => {
        console.log('nuevo pedido asignado', pedido);
        // this.loadPedidosPropios();
        const res = this.pedidoRepartidorService.addPedidoInListPedidosPendientes(pedido);
        console.log(res);
        this.darFormatoGrupoPedidosRecibidos(res.pedidos_repartidor);
        // this.listPedidos.push(pedido);
        // this.listeService.setNewPedidoRepartoPropio(pedido);
        // this.pedidoRepartidorService.playAudioNewPedido();
      });

    this.socketService.onDeliveryPedidoFin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((pedidoFin: PedidoRepartidorModel) => {
        // lanzar calificacion al cliente
        // console.log('fin del pedido', pedidoFin);
        this.openDialogCalificacion(pedidoFin);
      });
  }

  private loadPedidosPropios(): void {
    this.repartidorService.getMisPedidosPropiosAsignados()
      .subscribe((res: any) => {
        // console.log('propios pedidos', res);
        res.map(x => {
          x.json_datos_delivery = JSON.parse(x.json_datos_delivery);
        });

        this.listPedidos = res;
      });
  }


  // openDialogOrden(orden: any): void {
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;
  //   _dialogConfig.width = '700px';
  //   _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
  //   _dialogConfig.data = {
  //     laOrden: orden
  //   };

  //   const dialogRef = this.dialog.open(DialogOrdenDetalleComponent, _dialogConfig);
  // }


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

  goRuta() {
    let _addDir = '';
    this.listPedidos.map(p => {
      _addDir += `${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.latitude},${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.longitude}+to:`;
    });

    _addDir = _addDir.slice(0, -4);
    // const linkGPS = `http://maps.google.com/maps/dir/?api=1&origin=-6.028458-76.971177&waypoints=${_addDir}`;
    const linkGPS = `http://maps.google.com/maps?f=d&source=s_d&saddr=${this.establecimientoIni.latitude},${this.establecimientoIni.longitude}&daddr=${_addDir}`;
    window.open(linkGPS, '_blank');
  }

  entregaTodo() {
    this.pedidoRepartidorService.listaPedidosEntregados();
    this.listPedidos = null;
    this.sumListPedidos = 0;
    this.sumGananciaTotal = 0;
  }


  resumenDelDia() {
    this.isShowResumen = true;
  }

  goBackRepartidorRed() {
    this.router.navigate(['./main/pedidos']);
  }

  // // resumen de los pedidos
  // resumenInformativo() {
  //   let rowAddRepartidor: any = {};

  //   this.listRepartidoresInformativo = [];
  //   this.listPedidos.map((o: any, i: number) => {


  //     // if ( this.isComercioPropioRepartidor ) {
  //     // esta lista se usa tambien para mostrar repartidores y su ubicacion que no son propios
  //     // se muestra la ubicacion toda vez que el pedido no este cerrado (entregado al cliente)
  //       rowAddRepartidor = {
  //         idrepartidor: o.idrepartidor,
  //         num_pedidos: 1,
  //         // nom_repartidor: o.nom_repartidor,
  //         // ap_repartidor: o.ap_repartidor,
  //         metodoPago: [{
  //           num_pedidos: 1,
  //           idtipo_pago: o.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.idtipo_pago,
  //           descripcion: o.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.descripcion,
  //           importe: o.total === '0' ? parseFloat(o.total_r) : parseFloat(o.total)
  //         }],
  //         importe: o.total === '0' ? parseFloat(o.total_r) : parseFloat(o.total)
  //       };

  //       this.resumenInformativoRepartidores(rowAddRepartidor);

  //     // }
  //   });

  //   this.listRepartidoresInformativo = this.listRepartidoresInformativo.length > 0 ? this.listRepartidoresInformativo[0] : this.listRepartidoresInformativo;
  //   console.log('this.listResumenInformativo', this.listRepartidoresInformativo);
  //   this.isShowResumen = true;
  // }


  // // // si y solo si el comercio tiene repartidores propios
  // private resumenInformativoRepartidores(row: any) {
  //   // buscamos repartidor en lista
  //   const _elRepartidor = this.listRepartidoresInformativo.filter(r => r.idrepartidor === row.idrepartidor)[0];
  //   if ( _elRepartidor ) {

  //     _elRepartidor.num_pedidos += 1;
  //     _elRepartidor.importe += row.importe;

  //     // metodo de pago
  //     const _metodo = _elRepartidor.metodoPago.filter(m => m.idtipo_pago === row.metodoPago[0].idtipo_pago)[0];
  //     if ( _metodo ) {
  //       _metodo.num_pedidos += 1;
  //       _metodo.importe +=  row.metodoPago[0].importe;
  //     } else {
  //       _elRepartidor.metodoPago.push(row.metodoPago[0]);
  //     }

  //   } else {
  //     this.listRepartidoresInformativo.push(row);
  //   }

  //   // console.log('this.listRepartidoresInformativo', this.listRepartidoresInformativo);
  // }

}
