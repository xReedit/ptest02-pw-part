import { Component, OnInit } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-indicaciones-pedido',
  templateUrl: './indicaciones-pedido.component.html',
  styleUrls: ['./indicaciones-pedido.component.css']
})
export class IndicacionesPedidoComponent implements OnInit {
  coordenadasDestino: any = {};
  descripcionPago: string;
  dataPedido: PedidoRepartidorModel;
  geoPositionActual: GeoPositionModel;
  importeEfectivoPedido = 0;
  btnTitlePasos = 'Empezar';
  btnIsVisible = true;

  constructor(
    private pedidoRepartidorService: PedidoRepartidorService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private calcDistanciaService: CalcDistanciaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;

    // this.dataPedido.paso_va = 3;

    if ( this.dataPedido.datosDelivery.metodoPago.idtipo_pago === 1 ) {
      this.descripcionPago = `Pagar en efectivo S/. ${ parseFloat(this.dataPedido.importePedido).toFixed(2)}`;
      this.importeEfectivoPedido = parseFloat(this.dataPedido.importePedido) + parseFloat(this.dataPedido.c_servicio);
    } else {
      this.descripcionPago = `El pedido ya esta pagado, solo recoger.`;
    }

    this.showPasos();
    this.listenGeoPosition();
  }

  private listenGeoPosition(): void {
    // iniciamos el gps
    this.geoPositionService.onGeoWatchPosition();

    this.geoPositionActual = this.geoPositionService.geoPosition;
    this.geoPositionService.geoPositionNow$.subscribe((res: GeoPositionModel) => {
      if ( !res.latitude ) { return; }
      // verificar en que paso esta
      // si paso 1 verificar si se acerca al coordenadas destino y activar boton accion
      this.geoPositionActual = res;
      const isLLego = this.calcDistanciaService.calcDistancia(this.geoPositionActual, this.coordenadasDestino);
      console.log('distancia listen llego ?', isLLego);
      if ( isLLego && this.dataPedido.paso_va === 1) {
        this.dataPedido.paso_va = 2;
        this.pedidoRepartidorService.setPasoVa(2);
        this.showPasos();
        // this.btnIsVisible = true;
        // this.btnTitlePasos = 'Empezar';
      }
    });
  }

  private showPasos(): void {
    this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;

    console.log(this.dataPedido);
    switch (this.dataPedido.paso_va) {
      case 1 || null:
        this.coordenadasDestino.latitude = this.dataPedido.datosComercio.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosComercio.longitude;
        this.btnTitlePasos = 'Empezar';
        break;
      case 2: // apuntar a la direccion del cliente
        this.btnIsVisible = true;
        this.coordenadasDestino.latitude = this.dataPedido.datosCliente.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosCliente.longitude;
        this.btnTitlePasos = 'Paso 3 Empezar';
        break;
      // default:
      //   this.coordenadasDestino.latitude = this.dataPedido.datosComercio.latitude;
      //   this.coordenadasDestino.longitude = this.dataPedido.datosComercio.longitude;
      //   break;
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
    }
  }

  showDetallePedido() {
    if ( this.dataPedido.paso_va >= 2 ) {
      this.router.navigate(['./repartidor/pedido-detalle']);
    }
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.dataPedido.datosDelivery.telefono}`;
    window.open(_link, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.dataPedido.datosDelivery.telefono}`);
  }

}
