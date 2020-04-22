import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-mapa-ordenes',
  templateUrl: './mapa-ordenes.component.html',
  styleUrls: ['./mapa-ordenes.component.css']
})
export class MapaOrdenesComponent implements OnInit {
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  infowindow = new google.maps.InfoWindow();

  @Output() pedidoOpen = new EventEmitter<any>(); // abre el pedido en el dialog

  listPedidos: any;

  zoom = 15;
  center: google.maps.LatLngLiteral;
  options: google.maps.MapOptions = {
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    // mapTypeId: 'hybrid'
  };

  @Input()
  public set listaPedidos(list: any) {
    this.listPedidos = list;
    console.log('listPedidos', list);
    if ( list ) {
      this.addMarkerPedidos();
    }
  }

  markerOptionsPedido = {draggable: false, icon: './assets/images/marker-1.png'};
  markersPedidos = [];

  markerOptionsRepartidorDesarrollo = {draggable: true, icon: './assets/images/delivery-man.png'};
  markersRepartidorDesarrollo = [];


  constructor(
    private geoUbicationService: GpsUbicacionRepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    // produccioon
    // this.listenUbicaion();

    // desarrollo
    this.listeDesarrolloUbicacion();
  }

  private enviarUbicacion(ubicacion: any): void {
    const _data = {
      coordenadas : {
        latitude: ubicacion.lat,
        longitude: ubicacion.lng,
      },
      idcliente: this.pedidoRepartidorService.pedidoRepartidor.datosCliente.idcliente,
      idsede: this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede,
    };

    this.socketService.emit('repartidor-notifica-ubicacion', _data);
  }

  listenUbicaion() {
    this.geoUbicationService.onGeoWatchPosition();

    this.geoUbicationService.geoPositionNow$
      .subscribe(res => {
        console.log('geoposiion', res);
        this.center = { lat: res.latitude, lng: res.longitude };
        this.addMyMarkert();
      });

  }

  private addMyMarkert(): void {
    this.markersRepartidorDesarrollo.push({
      position: this.center,
      label: {
        fontWeight: '600',
        text: 'Yo'
      },
      title: 'Repartidor',
      info: 'Repartidor',
        options: {
          animation: google.maps.Animation.BOUNCE
        }
    });

    console.log('this.markersRepartidorDesarrollo', this.markersRepartidorDesarrollo);
  }


  // ordenes o pedidos

  private addMarkerPedidos(): void {
    // asigna el primer pedido
    this.pedidoRepartidorService.pedidoRepartidor = this.listPedidos[0];
    this.pedidoRepartidorService.setLocal();



    this.markersPedidos = [];
    this.listPedidos.map((p: any, i: number) => {
      const dataDelivery = p.json_datos_delivery.p_header.arrDatosDelivery; // .direccionEnvioSelected
      this.markersPedidos.push({
        position: {
          lat: dataDelivery.direccionEnvioSelected.latitude,
          lng: dataDelivery.direccionEnvioSelected.longitude
        },
        label: {
          color: '#0d47a1',
          fontWeight: '600',
          text: 'Pedido ' + (i + 1)
        },
        title: 'Pedido',
        info: p.idpedido,
        options: {
          animation: google.maps.Animation.BOUNCE
        }
      });

    });
  }

  openPedido(index: number): void {
    const itemPedido = this.listPedidos[index];
    this.pedidoOpen.emit(itemPedido);
  }
















  /// desarrollo
  listeDesarrolloUbicacion() {
    this.center = {'lat': -6.029306, 'lng': -76.969725};
    this.addMyMarkert();
  }

  updateUbicationDesarrollo($event) {
    console.log('new ubicacion', $event);
    this.center.lat = $event.latLng.lat();
    this.center.lng = $event.latLng.lng();

    this.enviarUbicacion(this.center);
  }
}
