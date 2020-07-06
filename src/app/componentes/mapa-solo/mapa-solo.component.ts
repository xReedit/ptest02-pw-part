import { Component, OnInit, Input } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit {
  @Input() coordenadas: any; // adonde ir

  miPosition: any; // position actual del repartidor
  bounds = null;

  // solo para desrrollo //
  idSedeDesarrollo: number;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private repartidorService: RepartidorService,
    private geoUbicationService: GpsUbicacionRepartidorService
    ) {
    // this.mapsAPILoader.load().then(() => {
    //   this.bounds = new google.maps.LatLngBounds(
    //     new google.maps.LatLng(this.coordenadas.latitude, this.coordenadas.longitude), // SW
    //     new google.maps.LatLng(this.coordenadas.latitude, this.coordenadas.longitude) // NE
    //   );
    // });
   }

  ngOnInit() {
    this.coordenadas.zoom = 15;
    console.log('mapa solo', this.coordenadas);

    // si tiene idsede es un repartidor suscrito a una sede entonces notifica alla su posicion
    this.idSedeDesarrollo = this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede;

    // solo desarrollo
    this.geoUbicationService.onGeoPosition();
    this.miPosition = this.geoUbicationService.geoPosition;
    this.miPosition = { lat: this.miPosition.latitude, lng: this.miPosition.longitude };

    // quitar si es desarrollo
    this.listenUbicaion();
  }


  // solo en desarrollo
  markerDragEnd($event: any) {
    const _coordenadasNow = {
      latitude: $event.coords.lat,
      longitude: $event.coords.lng,
    };

    // const geoposiionNow = new GeoPositionModel;
    // geoposiionNow = <GeoPositionModel>_coordenadasNow;
    // geoposiionNow.longitude = this.miPosition.lng;
    this.geoUbicationService.geoPosition = <GeoPositionModel>_coordenadasNow;

    // this.miPosition = { lat: res.latitude, lng: res.longitude };

    this.repartidorService.emitPositionNow(_coordenadasNow, this.pedidoRepartidorService.pedidoRepartidor, this.idSedeDesarrollo);

    // const _data = {
    //   coordenadas : {
    //     latitude: $event.coords.lat,
    //     longitude: $event.coords.lng,
    //   },
    //   idcliente: this.pedidoRepartidorService.pedidoRepartidor.datosCliente.idcliente
    // };

    // this.socketService.emit('repartidor-notifica-ubicacion', _data);
  }

  listenUbicaion() {
    this.geoUbicationService.onGeoWatchPosition();

    this.geoUbicationService.geoPositionNow$
      .subscribe(res => {
        // console.log('geoposiion', res);
        this.miPosition = { lat: res.latitude, lng: res.longitude };

        const geoposiionNow = new GeoPositionModel;
        geoposiionNow.latitude = this.miPosition.lat;
        geoposiionNow.longitude = this.miPosition.lng;

        this.geoUbicationService.geoPosition = geoposiionNow;
        this.geoUbicationService.set();

        // this.enviarUbicacion(this.center);
        // console.log('emitPositionNow');

        this.repartidorService.emitPositionNow(this.miPosition, this.pedidoRepartidorService.pedidoRepartidor, this.idSedeDesarrollo);
      });

  }

}
