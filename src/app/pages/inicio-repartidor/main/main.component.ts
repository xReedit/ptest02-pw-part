import { Component, OnInit, AfterViewInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';

import { Router } from '@angular/router';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  nomRepartidor: '';
  isOnNotificactionPush = false;
  isOnGeoPosition = false;
  isValid = false;
  constructor(
    private infoTokenService: InfoTockenService,
    private pushNotificationService: NotificacionPushService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private router: Router,
    private pedidoRepartidorService: PedidoRepartidorService
  ) { }

  ngOnInit(): void {

    this.infoTokenService.getInfoUs();
    console.log(this.infoTokenService.getInfoUs());
    this.nomRepartidor = this.infoTokenService.infoUsToken.usuario.nombre;

    this.pedidoRepartidorService.cleanLocal();

  }

  aceptarNotificacion() {
    this.pushNotificationService.getIsTienePermiso();
    this.isOnNotificactionPush = true;
    this.validConf();
  }

  aceptarPosition() {
    this.geoPositionService.onGeoPosition();

    setTimeout(() => {
      this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
      this.pushNotificationService.suscribirse();
      this.isOnGeoPosition = true;
      this.validConf();
    }, 1500);
  }

  private validConf() {
    this.isValid = this.isOnNotificactionPush && this.isOnGeoPosition;

    if ( this.isValid ) {

      setTimeout(() => {
        this.router.navigate(['./main']);
      }, 1400);

    }
  }

}
