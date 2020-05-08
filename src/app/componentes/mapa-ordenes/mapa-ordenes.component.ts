import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

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

  markerOptionsRepartidorProduccion = { icon: './assets/images/delivery-man.png'};
  markersRepartidorProduccion = [];


  constructor(
    private geoUbicationService: GpsUbicacionRepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private repartidorService: RepartidorService,
    private listenService: ListenStatusService
  ) { }

  ngOnInit(): void {
    // produccioon
    // this.listenUbicaion();

    // desarrollo
    this.listeDesarrolloUbicacion();

    // notifica cambios en cualquier pedido
    this.listenService.pedidoModificado$
      .subscribe(pedido => {
        if ( !pedido ) { return; }

        console.log('Cambiamos icono entregado');
        // buscar pedido en los marcadores
        const p = this.markersPedidos.filter(_p => _p.idpedido === pedido.idpedido)[0];
        const _options: google.maps.MarkerOptions = {
          animation: 0,
          draggable: false,
          icon: `./assets/images/marker-3.png`
        };

        p.options = _options;
      });
  }

  private enviarUbicacion(ubicacion: any): void {
    // const _data = {
    //   coordenadas : {
    //     latitude: ubicacion.lat,
    //     longitude: ubicacion.lng,
    //   },
    //   idcliente: this.pedidoRepartidorService.pedidoRepartidor.datosCliente.idcliente,
    //   idsede: this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede,
    // };

    // this.socketService.emit('repartidor-notifica-ubicacion', _data);
    const _pedidoSend = this.pedidoRepartidorService.pedidoRepartidor || null;
    this.repartidorService.emitPositionNow(ubicacion, this.pedidoRepartidorService.pedidoRepartidor);
  }

  listenUbicaion() {
    this.geoUbicationService.onGeoWatchPosition();

    this.geoUbicationService.geoPositionNow$
      .subscribe(res => {
        console.log('geoposiion', res);
        this.center = { lat: res.latitude, lng: res.longitude };

        const geoposiionNow = new GeoPositionModel;
        geoposiionNow.latitude = this.center.lat;
        geoposiionNow.longitude = this.center.lng;

        this.geoUbicationService.geoPosition = geoposiionNow;
        this.geoUbicationService.set();

        this.enviarUbicacion(this.center);
        this.addMyMarkert();
      });

  }

  private addMyMarkert(): void {
    this.markersRepartidorProduccion.push({
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
  }



  // ordenes o pedidos

  private addMarkerPedidos(): void {
    // asigna el primer pedido
    this.pedidoRepartidorService.pedidoRepartidor = this.listPedidos[0];
    this.pedidoRepartidorService.setLocal();



    this.markersPedidos = [];

    // this.listPedidos[this.listPedidos.length - 1].isLast = true;
    const indexLast = this.listPedidos.length - 1;

    this.listPedidos.map((p: any, i: number) => {
      let iconMarker = 'marker-1.png';
      let tituloText = 'Pedido ' + (i + 1);
      const dataDelivery = p.json_datos_delivery.p_header.arrDatosDelivery; // .direccionEnvioSelected
      p.isLast = indexLast === i ? true : false;

      if ( p.pwa_delivery_status.toString()  === '4' ) {
        iconMarker = 'marker-3.png';
        tituloText = '-';
      }

      this.markersPedidos.push({
        idpedido: p.idpedido,
        position: {
          lat: dataDelivery.direccionEnvioSelected.latitude,
          lng: dataDelivery.direccionEnvioSelected.longitude
        },
        label: {
          color: '#0d47a1',
          fontWeight: '600',
          text: tituloText
        },
        title: 'Pedido',
        info: p.idpedido,
        options: {
          draggable: false,
          animation: p.isLast ? google.maps.Animation.BOUNCE  : 0,
          icon: `./assets/images/${iconMarker}`
        }
      });

    });
  }

  openPedido(index: number): void {
    const itemPedido = this.listPedidos[index];
    this.pedidoOpen.emit(itemPedido);
  }













  private addMyMarkertDesarrolllo(): void {
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


  /// desarrollo
  listeDesarrolloUbicacion() {
    this.center = {'lat': -6.029306, 'lng': -76.969725};
    this.addMyMarkertDesarrolllo();
  }

  updateUbicationDesarrollo($event) {
    console.log('new ubicacion', $event);
    this.center.lat = $event.latLng.lat();
    this.center.lng = $event.latLng.lng();

    const geoposiionNow = new GeoPositionModel;
    geoposiionNow.latitude = this.center.lat;
    geoposiionNow.longitude = this.center.lng;

    this.geoUbicationService.geoPosition = geoposiionNow;
    this.geoUbicationService.set();

    this.enviarUbicacion(this.center);
  }
}

