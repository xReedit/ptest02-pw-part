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
  geoPositionComercio: GeoPositionModel = new GeoPositionModel();

  isLlegoDestino = false;

  importeEfectivo = '';
  dataPedido: any;

  indicacionesComprobante = '';
  comprobanteSolicitar = '';

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

    this.dataPedido = this.pedidoRepartidorService.pedidoRepartidor;
    // dataPedido.datosDelivery = dataPedido.datosDelivery ? dataPedido.datosDelivery : dataPedido.
    this.importeEfectivo = this.dataPedido.datosDelivery.metodoPago?.importe || '';

    this.coordenadasDestino = {
      latitude: this.dataPedido.datosCliente.latitude,
      longitude: this.dataPedido.datosCliente.longitude,
    };

    const _dni = this.orden.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.dni || '';
    const _dniRuc = _dni === '' ? '' : _dni.length > 8 ? 'RUC ' : 'DNI ';
    const _otro = this.orden.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.otro || '';
    this.indicacionesComprobante = _dni === '' ? 'Publico en general.' :
                                    _dniRuc + ' ' + _dni + ' - ' + _otro;
    this.comprobanteSolicitar = this.orden.json_datos_delivery.p_header.arrDatosDelivery.tipoComprobante.descripcion;

    // calcular la distancia con el repartidor si esta cerca activa "recibi conforme" y "llamar a repartidor"
    this.isLlegoDestino = this.calcDistanciaService.calcDistancia(<GeoPositionModel>this.geoPositionActual, <GeoPositionModel>this.coordenadasDestino, 120);
    // console.log('orden', this.orden);
  }

  cerrarDetalles(val: boolean) {
    if ( val ) {
      this.closeWindow.emit(val);
    }
  }

  goDireccion() {
    const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.coordenadasDestino.latitude},${this.coordenadasDestino.longitude}`;
    window.open(linkGPS, '_blank');

    setTimeout(() => {
      this.cerrarDetalles(true);
    }, 500);
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.dataPedido.datosDelivery.telefono}`;
    window.open(_link, '_blank');
  }

  irAlComercio() {
    this.geoPositionComercio.latitude = typeof this.dataPedido.datosDelivery.establecimiento.latitude === 'string'  ? parseFloat(this.dataPedido.datosDelivery.establecimiento.latitude) :
                                        this.dataPedido.datosDelivery.establecimiento.latitude;
    this.geoPositionComercio.longitude = typeof this.dataPedido.datosDelivery.establecimiento.longitude === 'string'  ? parseFloat(this.dataPedido.datosDelivery.establecimiento.longitude) :
                                        this.dataPedido.datosDelivery.establecimiento.longitude;

    const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.geoPositionComercio.latitude},${this.geoPositionComercio.longitude}`;
    window.open(linkGPS, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.dataPedido.datosDelivery.telefono}`);
  }

  PedidoEntregado() {
    this.orden.pwa_estado = 'E'; // marcar como entregado
    this.orden.estado = 2; // marcar como entregado
    if ( this.orden.isRepartidorRed ) {

        // si viene de red repartidore
        this.pedidoRepartidorService.finalizarPedido(true);

    } else {
      this.pedidoRepartidorService.finalizarPedidoPropioRepartidor();
    }

    setTimeout(() => {
      this.cerrarDetalles(this.orden);
    }, 500);
  }

}
