import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy, AfterContentInit, AfterViewInit } from '@angular/core';
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
export class MapaOrdenesComponent implements OnInit, AfterViewInit {

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


  @Input() trazarRuta = false;
  @Input()
  public set listaPedidos(list: any) {
    this.listPedidos = list;
    // console.log('listPedidos', list);
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

  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;


  private _isSedeFirtPedido = 0;
  private _isFirtPedido = 0;

  constructor(
    private geoUbicationService: GpsUbicacionRepartidorService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private repartidorService: RepartidorService,
    private listenService: ListenStatusService
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {


    if ( this.trazarRuta ) {
      this.listPedidos = this.pedidoRepartidorService.getLocalItems();
      this._isSedeFirtPedido = this.listPedidos[0].idsede;
      this._isFirtPedido = this.listPedidos[0];

      // console.log('antes orden', this.listPedidos);

      // ordernar por distancia para trazar la ruta
      this.listPedidos = this.listPedidos
        .sort(( a, b ) => parseFloat(a.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km) - parseFloat(b.json_datos_delivery.p_header.arrDatosDelivery.establecimiento.distancia_km));

      // console.log('despues orden', this.listPedidos);
      this.addMarkerPedidos();
    }



    // desarrollo
    // this.listeDesarrolloUbicacion();

    // produccioon
    this.listenUbicaion();


    // traza la ruta mas corta
      if ( this.trazarRuta ) {
        this.directionMap();
      }

    this.listenPedidos();
  }

  private listenPedidos() {
    // console.log('eeeeeeeeeeee');

    // noitifica nuevo pedido para agregar al markert
    this.listenService.newPedidoRepartoPropio$
      .subscribe(pedido => {
        if (pedido) {
          pedido.idpedido = typeof pedido.idpedido === 'string' ? parseInt(pedido.idpedido, 0) : pedido.idpedido;
          const isExistePedido = this.listPedidos.filter(p => p.idpedido === pedido.idpedido)[0];
          if ( !isExistePedido ) {
            this.listPedidos.push(pedido);
          }
          this.addMarkerPedidos();
        }
      });

    // notifica cambios en cualquier pedido
    this.listenService.pedidoModificado$
      .subscribe(pedido => {
        if ( !pedido ) { return; }

        // console.log('Cambiamos icono entregado');
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
    const _pedidoSend = this.trazarRuta ? this._isFirtPedido : this.pedidoRepartidorService.pedidoRepartidor || null;
    const _idsedeComercio = this.trazarRuta ? this._isSedeFirtPedido : this.pedidoRepartidorService.pedidoRepartidor.idsede || null;
    this.repartidorService.emitPositionNow(ubicacion, this.pedidoRepartidorService.pedidoRepartidor, _idsedeComercio);
  }

  listenUbicaion() {

    const _miposticion = this.geoUbicationService.getGeoPosition();

    // console.log('_miposticion', _miposticion);

    this.geoUbicationService.geoPositionNow$
      .subscribe(res => {
        // console.log('geoposiion', res);
        res = res.latitude ? res : _miposticion;
        this.center = { lat: res.latitude, lng: res.longitude };

        const geoposiionNow = new GeoPositionModel;
        geoposiionNow.latitude = this.center.lat;
        geoposiionNow.longitude = this.center.lng;

        this.geoUbicationService.geoPosition = geoposiionNow;
        this.geoUbicationService.set();

        // console.log('mi position', this.center);
        this.enviarUbicacion(this.center);
        this.addMyMarkert();
      });

      this.geoUbicationService.onGeoWatchPosition();
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
    // this.pedidoRepartidorService.pedidoRepartidor = this.listPedidos[0];
    // this.pedidoRepartidorService.setLocal();



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
    // console.log('oreden de mapa-ordenes', itemPedido);
    this.pedidoOpen.emit(itemPedido);
  }


  // trazar ruta
  directionMap() {

    // const directionsRenderer = new google.maps.DirectionsRenderer({suppressMarkers: true});
    const directionsService = new google.maps.DirectionsService();

    // const directionsService = new google.maps.DirectionsService;
    // const directionsRenderer = new google.maps.DirectionsRenderer;

    const rendererOptions = {
      preserveViewport: false,
      suppressMarkers: true
    };

    const waypoints = [];
    this.markersPedidos.map(m => {
      waypoints.push({
        location: m.position,
        stopover: true
    });
    });

    const _destination = this.markersPedidos[this.markersPedidos.length - 1].position;

    // console.log('waypoints', waypoints);
    // console.log('_destination', _destination);
    const request = {
      origin: this.center,
      destination: this.markersPedidos[this.markersPedidos.length - 1].position,
      waypoints: waypoints, // an array of waypoints
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      durationInTraffic: false,
      avoidHighways: true,
      avoidTolls: true
     };


     const directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
     directionsDisplay.setMap(this.map._googleMap);

    //  const dmatrix = new google.maps.DistanceMatrixService();

     directionsService.route(request, function(result, status) {
      // console.log(result);

      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
        }
     });
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

    // console.log('this.markersRepartidorDesarrollo', this.markersRepartidorDesarrollo);
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

