import { Component, OnInit } from '@angular/core';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';

@Component({
  selector: 'app-dialog-efectivo-repartidor',
  templateUrl: './dialog-efectivo-repartidor.component.html',
  styleUrls: ['./dialog-efectivo-repartidor.component.css']
})
export class DialogEfectivoRepartidorComponent implements OnInit {
  isOnNotificactionPush = false;
  isOnGeoPosition = false;
  importeIndicado = 0;
  importe = '';
  constructor(
    private pushNotificationService: NotificacionPushService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private infoTokenService: InfoTockenService,
    private repartidorService: RepartidorService
  ) { }

  ngOnInit() {
    this.isOnNotificactionPush = this.pushNotificationService.getIsTienePermiso();

    this.geoPositionService.onGeoPosition();

    setTimeout(() => {
      this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
      this.pushNotificationService.suscribirse();
    }, 1500);
  }

  guardarEfectivoMano() {

    this.repartidorService.guardarEfectivo(this.importeIndicado);

    // comienza a registrar posicion actual
    this.geoPositionService.onGeoWatchPosition();

    this.infoTokenService.setEfectivoMano(this.importeIndicado);

  }

  validImporte(val: string) {
    this.importeIndicado = isNaN(parseInt(val, 0)) ? 0 : parseInt(val, 0);
  }

}
