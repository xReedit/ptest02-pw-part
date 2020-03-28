import { Component, OnInit } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';

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
    private calcDistanciaService: CalcDistanciaService
  ) { }

  ngOnInit() {
    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;

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
      if ( isLLego ) {
        this.dataPedido.paso_va = 2;
        this.btnIsVisible = true;
      }
    });
  }

  private showPasos(): void {
    this.dataPedido.paso_va = this.dataPedido.paso_va ? this.dataPedido.paso_va : 1;

    if ( this.dataPedido.datosDelivery.metodoPago.idtipo_pago === 1 ) {
      this.descripcionPago = `Pagar en efectivo S/. ${ parseFloat(this.dataPedido.datosDelivery.importeTotal).toFixed(2)}`;
      this.importeEfectivoPedido = this.dataPedido.datosDelivery.importeTotal + this.dataPedido.datosComercio.c_servicio;
    } else {
      this.descripcionPago = `El pedido ya esta pagado, solo recoger.`;
    }

    console.log(this.dataPedido);
    switch (this.dataPedido.paso_va) {
      case 1 || null:
        this.coordenadasDestino.latitude = this.dataPedido.datosComercio.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosComercio.longitude;
        break;
      default:
        this.coordenadasDestino.latitude = this.dataPedido.datosComercio.latitude;
        this.coordenadasDestino.longitude = this.dataPedido.datosComercio.longitude;
        break;
    }
  }

  btnEjecutar() {
    switch (this.dataPedido.paso_va) {
      case 1:
        const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
        window.open(linkGPS, '_blank');
        this.btnIsVisible = false;
        this.btnTitlePasos = 'Llegue';
        break;
    }
  }

}
