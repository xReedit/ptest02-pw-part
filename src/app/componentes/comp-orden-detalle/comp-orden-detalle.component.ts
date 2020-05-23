import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-comp-orden-detalle',
  templateUrl: './comp-orden-detalle.component.html',
  styleUrls: ['./comp-orden-detalle.component.css']
})
export class CompOrdenDetalleComponent implements OnInit {
  @Input() orden: any;
  @Output() closeWindow = new EventEmitter<boolean>(false); // manda cerrar el dialog

  coordenadasDestino: any = {};
  geoPositionActual: GeoPositionModel;

  isLlegoDestino = false;

  importeEfectivo = '';

  constructor(
    private pedidoRepartidorService: PedidoRepartidorService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private calcDistanciaService: CalcDistanciaService,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {
    this.pedidoRepartidorService.darFormatoLocalPedidoRepartidorModel(this.orden);
    // // this.pedidoRepartidorService.pedidoRepartidor = this.orden;
    this.pedidoRepartidorService.setLocal();


    this.geoPositionService.get();
    this.geoPositionActual = this.geoPositionService.getGeoPosition();

    const dataPedido = this.pedidoRepartidorService.pedidoRepartidor;
    this.importeEfectivo = dataPedido.datosDelivery.metodoPago?.importe || '';

    this.coordenadasDestino = {
      latitude: dataPedido.datosCliente.latitude,
      longitude: dataPedido.datosCliente.longitude,
    };

    // calcular la distancia con el repartidor si esta cerca activa "recibi conforme" y "llamar a repartidor"
    this.isLlegoDestino = this.calcDistanciaService.calcDistancia(<GeoPositionModel>this.geoPositionActual, <GeoPositionModel>this.coordenadasDestino, 20);
    console.log('orden', this.orden);
  }

  cerrarDetalles(val: boolean) {
    if ( val ) {
      this.closeWindow.emit(val);
    }
  }

  goDireccion() {
    const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
    window.open(linkGPS, '_blank');
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.orden.datosDelivery.telefono}`;
    window.open(_link, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.orden.datosDelivery.telefono}`);
  }

  PedidoEntregado() {
    this.pedidoRepartidorService.finalizarPedidoPropioRepartidor();

    setTimeout(() => {
      this.cerrarDetalles(true);
    }, 500);
  }

}
