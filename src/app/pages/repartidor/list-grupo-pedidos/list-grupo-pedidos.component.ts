import { Component, OnInit, OnDestroy } from '@angular/core';
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

  btnTitlePasos = 'Vamos, vamos!!';
  dataPedido: PedidoRepartidorModel;
  displayedColumns: string[] = ['Pedido', 'Cliente', 'Importe'];


  geoPositionActual: GeoPositionModel = new GeoPositionModel();
  geoPositionComercio: GeoPositionModel = new GeoPositionModel();

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private pedidoRepartidorService: PedidoRepartidorService,
    private utilService: UtilitariosService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private listenService: ListenStatusService,
    private calcDistanciaService: CalcDistanciaService,
    private router: Router,
    private dialog: MatDialog,
    private repartidorServcice: RepartidorService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {

    // this.pedidoRepartidorService.init();
    // this.dataPedido = this.pedidoRepartidorService.getLocal();

    // // load dlista
    // this.listPedidos = this.pedidoRepartidorService.getLocalItems();

    // // ordenar po distancia
    // this.listPedidos = this.listPedidos
    //     .sort(( a, b ) => parseFloat(a.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km) - parseFloat(b.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km));

    // //

    // this.comercioPedido = this.listPedidos[0].json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
    // this.dataPedido.idsede  = this.listPedidos[0].idsede; // idsede del grupo de pedidos

    // this.pedidoRepartidorService.setLocal();

    // // ubicacion comercio
    // this.geoPositionComercio.latitude = typeof this.comercioPedido.latitude === 'string'  ? parseFloat(this.comercioPedido.latitude) : this.comercioPedido.latitude;
    // this.geoPositionComercio.longitude = typeof this.comercioPedido.longitude === 'string'  ? parseFloat(this.comercioPedido.longitude) : this.comercioPedido.longitude;

    // // sumar total a pagar
    // this.sumListPedidos = this.listPedidos.map( p => p.importe_pagar_comercio).reduce((a, b) => a + b, 0);
    // this.sumGananciaTotal = this.dataPedido.sumGananciaTotal;
    // console.log('this.listPedidos', this.listPedidos);

    this.iniComponente();


    this.geoPositionService.onGeoWatchPosition();
    this.listenGeoPosition();


    // escuchar pedidos asignados
    this.socketService.onRepartidorGetPedidoPendienteAceptar()
    .subscribe((res: any) => {
      this.darFormatoGrupoPedidosRecibidos(res[0].pedido_por_aceptar);
    });

    // this.pedidoRepartidorService.lis

    // if ( this.dataPedido.estado.toString() === '4' ) {
    //   // this.btnTerminarVisible = true;
    //   this.dataPedido.paso_va = 4;
    //   this.pedidoRepartidorService.setPasoVa(4);
    // }

    // this.showPasos();
    // this.calcHora();
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
          // console.log('res', response);

          // formateamos el json_}¿datos
          const _listAsignar = response.map(p => {
            p.json_datos_delivery = JSON.parse(p.json_datos_delivery);
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

    this.geoPositionActual = this.geoPositionService.geoPosition;
    this.geoPositionService.geoPositionNow$ // .subscribe((res: GeoPositionModel) => {
    // this.listenService.myPosition$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: GeoPositionModel) => {
      res = !res?.latitude ? this.geoPositionActual : res;
      if ( !res.latitude ) { return; }
      // verificar en que paso esta
      // si paso 1 verificar si se acerca al coordenadas destino y activar boton accion
      this.geoPositionActual = res;
      const isLLego = this.geoPositionComercio.latitude ? this.calcDistanciaService.calcDistancia(this.geoPositionActual, this.geoPositionComercio, 120) : false;

      if ( !isLLego ) {
        if ( this.dataPedido.pedido_paso_va === 1) {
          this.dataPedido.pedido_paso_va = 2; // en el local
          this.pedidoRepartidorService.setPedidoPasoVa(2);
          this.dataPedido.pedido_paso_va = 2;

          console.log('guarda paso va 2');

          this.repartidorServcice.guardarPasoVa(2);
          // this.pedidoRepartidorService.setPasoVa(2);
          // this.pedidoRepartidorService.setLocal();
          this.showPasos();
          // this.btnIsVisible = true;
          // this.btnTitlePasos = 'Empezar';
        }

      }

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
        this.btnTitlePasos = 'Ir a Entregar';
        break;
    }
  }

  btnEjecutar() {
      let linkGPS = '';
      // this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;
      // this.pedidoRepartidorService.setPasoVa(this.dataPedido.paso_va);
      switch (this.dataPedido.pedido_paso_va) {
        case 1:
          linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.geoPositionComercio.latitude},${this.geoPositionComercio.longitude}`;
          window.open(linkGPS, '_blank');
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
  }

}
