import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { Subject } from 'rxjs/internal/Subject';
import { Router } from '@angular/router';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogOrdenDetalleComponent } from 'src/app/componentes/dialog-orden-detalle/dialog-orden-detalle.component';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';
import { TimeLinePedido } from 'src/app/modelos/time.line.pedido';
import { SendMsjService } from 'src/app/shared/services/send-msj.service';

@Component({
  selector: 'app-list-grupo-pedidos',
  templateUrl: './list-grupo-pedidos.component.html',
  styleUrls: ['./list-grupo-pedidos.component.css']
})
export class ListGrupoPedidosComponent implements OnInit, OnDestroy {
  timerRun: any;
  listPedidos: any;
  sumListPedidos = 0;
  sumGananciaTotal = 0;
  comercioPedido: any;
  btnShow = true; // cuando llega al local ya no figura este - ya no envia al mapa mostrando la ruta mas corta

  btnTitlePasos = 'Vamos, vamos!!';
  dataPedido: PedidoRepartidorModel;
  displayedColumns: string[] = ['Comercio', 'Cliente', 'Importe'];


  geoPositionActual: GeoPositionModel = new GeoPositionModel();
  geoPositionComercio: GeoPositionModel = new GeoPositionModel();
  geoPositionComercioCapacitor: any;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  isEntregadoAll = false;

  constructor(
    private infoTokenService: InfoTockenService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private utilService: UtilitariosService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private listenService: ListenStatusService,
    private calcDistanciaService: CalcDistanciaService,
    private router: Router,
    private dialog: MatDialog,
    private repartidorServcice: RepartidorService,
    private socketService: SocketService,
    private sendMsjService: SendMsjService,
  ) { }

  ngOnInit(): void {

    this.iniComponente();

    this.geoPositionService.get();
    this.geoPositionActual = this.geoPositionService.getGeoPosition();


    setTimeout(() => {    
      this.geoPositionService.onGeoWatchPosition();
      // this.geoPositionService.onGeoWatchPositionCapacitor();
      this.listenGeoPosition();    
    }, 1000);


    // escuchar pedidos asignados
    this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .subscribe((res: any) => {
      console.log('pedndientes', res);
      this.pedidoRepartidorService.setPedidoPorAceptar(res[0].pedido_por_aceptar);
      this.darFormatoGrupoPedidosRecibidos(res[0].pedido_por_aceptar);
    });


    // si se vuelve a conectar incia el geolocation
    this.socketService.isSocketOpen$.subscribe(res => {
      if (res) {
        this.geoPositionService.onGeoWatchPosition();
      }
    })

  }

  private iniComponente() {

    this.pedidoRepartidorService.init();
    this.dataPedido = this.pedidoRepartidorService.getLocal();

    // load dlista
    this.listPedidos = this.pedidoRepartidorService.getLocalItems();
    console.log('this.listPedidos', this.listPedidos);
    this.listPedidos = this.listPedidos.map(p => {
      p.time_line = p.time_line || new TimeLinePedido()
      return p;
    })

    // ordenar po distancia
    this.listPedidos = this.listPedidos
        .sort(( a, b ) => parseFloat(a.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km) - parseFloat(b.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km));

    //

    // console.log('this.listPedidos', this.listPedidos);

    this.checkIsEntregaALL();

    this.comercioPedido = this.listPedidos[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
    this.dataPedido.idsede  = this.listPedidos[0].idsede; // idsede del grupo de pedidos

    this.pedidoRepartidorService.setLocal();

    // ubicacion comercio
    this.geoPositionComercio.latitude = typeof this.comercioPedido.latitude === 'string'  ? parseFloat(this.comercioPedido.latitude) : this.comercioPedido.latitude;
    this.geoPositionComercio.longitude = typeof this.comercioPedido.longitude === 'string'  ? parseFloat(this.comercioPedido.longitude) : this.comercioPedido.longitude;

    // sumar total a pagar
    this.sumListPedidos = this.listPedidos.map( p => p.importe_pagar_comercio).reduce((a, b) => a + b, 0);
    this.sumGananciaTotal = this.dataPedido.sumGananciaTotal;

    this.showPasos();
    this.calcHora();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerRun);
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }



  private darFormatoGrupoPedidosRecibidos(pedidos: any) {    
    if ( !pedidos ) {return; }
    const sumAcumuladoPagar = pedidos.importe_pagar;
    this.pedidoRepartidorService.loadPedidosRecibidos(pedidos.pedidos.join(','))
        .subscribe((response: any) => {
          console.log('res', response);

          // formateamos el json_}¿datos
          const _listAsignar = response.map(p => {
            p.json_datos_delivery = JSON.parse(p.json_datos_delivery); 
            console.log('p.json_datos_delivery', p.json_datos_delivery);           
            p.importe_pagar_comercio =  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.importeTotal) -  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery);
            p.importe_pagar_comercio = p.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.idtipo_pago === 2 ? 0 : p.importe_pagar_comercio;
            return p;
          });


          const listPedidosGroup = JSON.parse(JSON.stringify(_listAsignar));

          this.pedidoRepartidorService.setLocalIds(pedidos);
          this.pedidoRepartidorService.setLocalItems( listPedidosGroup );

          // this.pedidoRepartidorService.playAudioNewPedido();

          this.iniComponente();

        });
  }

  // private darFormatoGrupoPedidosRecibidos(pedidos: any) {
  //   if ( !pedidos ) {return; }
  //   this.sumAcumuladoPagar = pedidos.importe_pagar;
  //   this.pedidoRepartidorService.loadPedidosRecibidos(pedidos.pedidos.join(','))
  //       .subscribe((response: any) => {
  //         // console.log('res', response);

  //         // formateamos el json_}¿datos
  //         const _listAsignar = response.map(p => {
  //           p.json_datos_delivery = JSON.parse(p.json_datos_delivery);
  //           p.importe_pagar_comercio =  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.importeTotal) -  parseFloat(p.json_datos_delivery.p_header.arrDatosDelivery.costoTotalDelivery);
  //           p.importe_pagar_comercio = p.json_datos_delivery.p_header.arrDatosDelivery.metodoPago.idtipo_pago === 2 ? 0 : p.importe_pagar_comercio;
  //           return p;
  //         });


  //         this.listPedidosGroup = JSON.parse(JSON.stringify(_listAsignar));

  //         this.pedidoRepartidorService.setLocalIds(pedidos);
  //         this.pedidoRepartidorService.setLocalItems( this.listPedidosGroup );

  //         this.pedidoRepartidorService.playAudioNewPedido();

  //       });
  // }

  private calcHora() {
    this.calHoraList();
    this.timerRun = setInterval(() => {this.calHoraList(); }, 60000);
  }

  private calHoraList() {
    this.listPedidos.map(p => {
      p.hora_show = this.utilService.xTiempoTranscurridos_en_minutos(p.hora);
    });
  }


  private listenGeoPosition(): void {

    // capacitor
    // this.geoPositionService.geoPositionCapacitorNow$      
    // .pipe(takeUntil(this.destroy$))
    // .subscribe((res: GeoPositionModel) => {
    //   console.log('geoPositionCapacitorNow', res);
    //   this.geoPositionComercioCapacitor = res;

    //   res = !res?.latitude ? this.geoPositionActual : res;
    //   if ( !res.latitude ) { return; }
    //   this.geoPositionActual = res;

    //   this.pedidoRepartidorService.checkLLegoComercio(this.listPedidos, this.geoPositionActual)
    // })



    this.geoPositionActual = this.geoPositionService.geoPosition;
    this.geoPositionService.geoPositionNow$    
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: GeoPositionModel) => {
      console.log('geoPositionActual', res);
      res = !res?.latitude ? this.geoPositionActual : res;
      if ( !res.latitude ) { return; }
      // verificar en que paso esta
      // si paso 1 verificar si se acerca al coordenadas destino y activar boton accion
      this.geoPositionActual = res;
      this.pedidoRepartidorService.checkLLegoComercio(this.listPedidos, this.geoPositionActual)
      
      // const isLLego = this.geoPositionComercio.latitude ? this.calcDistanciaService.calcDistancia(this.geoPositionActual, this.geoPositionComercio, 120) : false;

      // if ( !isLLego ) {
      //   if ( this.dataPedido.pedido_paso_va === 1) {
      //     this.dataPedido.pedido_paso_va = 2; // en el local
      //     this.pedidoRepartidorService.setPedidoPasoVa(2);
      //     this.dataPedido.pedido_paso_va = 2;

      //     console.log('guarda paso va 2');

      //     this.repartidorServcice.guardarPasoVa(2);
      //     // this.pedidoRepartidorService.setPasoVa(2);
      //     // this.pedidoRepartidorService.setLocal();
      //     this.showPasos();
      //     // this.btnIsVisible = true;
      //     // this.btnTitlePasos = 'Empezar';
      //   }

      // }

    });
  }

  private showPasos(): void {
    // this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;

    // console.log('this.dataPedido.paso_va', this.dataPedido.paso_va);

    // console.log(this.dataPedido);
    switch (this.dataPedido.pedido_paso_va) {
      case 0 || null:
        this.btnTitlePasos = 'Empezar';
        break;
      case 1 || null:
        this.btnTitlePasos = 'Empezar';
        break;
      default: // apuntar a la direccion del cliente
        this.btnShow = false;
        this.btnTitlePasos = 'Ir a Entregar';
        break;
    }
  }

  goRuta() {
    let _addDir = '';
    this.listPedidos.map(p => {
      _addDir += `${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.latitude},${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.longitude}+to:`;
    });

    _addDir = _addDir.slice(0, -4);
    // const linkGPS = `http://maps.google.com/maps/dir/?api=1&origin=-6.028458-76.971177&waypoints=${_addDir}`;
    const linkGPS = `http://maps.google.com/maps?f=d&source=s_d&saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${_addDir}`;
    window.open(linkGPS, '_blank');
  }

  entregaTodo() {
    this.pedidoRepartidorService.listaPedidosEntregados();
    this.listPedidos = null;
    this.sumListPedidos = 0;
    this.sumGananciaTotal = 0;
    this.router.navigate(['./main/pedidos']);
  }

  btnEjecutar() {
      // let linkGPS = '';
      // this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;
      // this.pedidoRepartidorService.setPasoVa(this.dataPedido.paso_va);
      switch (this.dataPedido.pedido_paso_va) {
        case 1:
          let _addDir = '';
          this.listPedidos.map(p => {
            _addDir += `${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.latitude},${p.json_datos_delivery.p_header.arrDatosDelivery.direccionEnvioSelected.longitude}+to:`;
          });

          _addDir = _addDir.slice(0, -4);
          // const linkGPS = `http://maps.google.com/maps/dir/?api=1&origin=-6.028458-76.971177&waypoints=${_addDir}`;
          const linkGPS = `http://maps.google.com/maps?f=d&source=s_d&saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${_addDir}`;
          window.open(linkGPS, '_blank');

          // linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.geoPositionComercio.latitude},${this.geoPositionComercio.longitude}`;
          // window.open(linkGPS, '_blank');
          // this.btnTitlePasos = 'Llegue';
          // this.pedidoRepartidorService.setPasoVa(2);
          break;
        default: // enviamos al mapa trazamos la ruta mas corta
          this.pedidoRepartidorService.setPedidoPasoVa(3);
          this.dataPedido.pedido_paso_va = 3;
          this.repartidorServcice.guardarPasoVa(3);
          this.router.navigate(['/main/indicaciones-mapa-grupo']);
          break;
      }
  }

  irAlComercio() {
    const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.geoPositionComercio.latitude},${this.geoPositionComercio.longitude}`;
    window.open(linkGPS, '_blank');
  }

  // showDetallePedido(row: any) {
  //   // console.log('show pedido', row);
  //   this.pedidoRepartidorService.setPedidoSelect(row);
  //   // if ( this.dataPedido.paso_va >= 2 ) {
  //     this.router.navigate(['./main/pedido-detalle']);
  //   // }
  // }

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
        // console.log('el pedido', pedido);
        this.checkIsEntregaALL();

        // 211222 no califica
        // if ( pedido.pwa_estado === 'E' ) {
        //   this.openDialogCalificacion(pedido);
        // }
      }
    );
  }

  private checkIsEntregaALL() {
    const _res = this.listPedidos.filter(p => p.pwa_estado !== 'E');
    this.isEntregadoAll = _res.length === 0;
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


  testLlege(item) {
    console.log('item', item);
    const _newTimeLinePedido = item.time_line
    _newTimeLinePedido.paso = 1;    
    _newTimeLinePedido.llego_al_comercio = true;
    this.sendMsjService.msjClienteTimeLine(item, _newTimeLinePedido);
  }

  testEnCamino(item) {
    console.log('item', item);
    const _newTimeLinePedido = item.time_line
    if ( _newTimeLinePedido.paso === 1 ) {
      _newTimeLinePedido.paso = 2;      
      _newTimeLinePedido.en_camino_al_cliente = true;
      this.sendMsjService.msjClienteTimeLine(item, _newTimeLinePedido);
    }
  }

  recargarPedido() {
    location.reload();
  }

}
