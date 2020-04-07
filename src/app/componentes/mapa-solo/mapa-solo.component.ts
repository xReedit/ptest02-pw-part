import { Component, OnInit, Input } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit {
  @Input() coordenadas: any;
  bounds = null;

  constructor(
    private mapsAPILoader: MapsAPILoader,
    private socketService: SocketService,
    private pedidoRepartidorService: PedidoRepartidorService
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
  }


  // solo en desarrollo
  markerDragEnd($event: any) {

    const _data = {
      coordenadas : {
        latitude: $event.coords.lat,
        longitude: $event.coords.lng,
      },
      idcliente: this.pedidoRepartidorService.pedidoRepartidor.datosCliente.idcliente
    };

    this.socketService.emit('repartidor-notifica-ubicacion', _data);
  }

}
