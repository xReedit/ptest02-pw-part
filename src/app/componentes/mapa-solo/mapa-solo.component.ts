import { Component, OnInit, Input } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit {
  @Input() coordenadas: any;
  bounds = null;

  // solo para desrrollo //
  idSedeDesarrollo: number;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService,
    private repartidorService: RepartidorService
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

    this.idSedeDesarrollo = this.pedidoRepartidorService.pedidoRepartidor.datosComercio.idsede;
  }


  // solo en desarrollo
  markerDragEnd($event: any) {
    const _coordenadasNow = {
      latitude: $event.coords.lat,
      longitude: $event.coords.lng,
    };

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

}
