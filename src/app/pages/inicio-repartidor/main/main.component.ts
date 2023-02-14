import { Component, OnInit, AfterViewInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';

import { Router } from '@angular/router';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,    
  Token,
} from '@capacitor/push-notifications';

import { Plugins } from '@capacitor/core';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { IS_NATIVE } from 'src/app/shared/config/config.const';

const { Geolocation } = Plugins;

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
  is

  constructor(
    private infoTokenService: InfoTockenService,
    private pushNotificationService: NotificacionPushService,
    private geoPositionService: GpsUbicacionRepartidorService,
    private router: Router,
    private pedidoRepartidorService: PedidoRepartidorService,
    private utilitarioService: UtilitariosService
  ) { }

  ngOnInit(): void {

    this.infoTokenService.getInfoUs();
    // console.log(this.infoTokenService.getInfoUs());
    this.nomRepartidor = this.infoTokenService.infoUsToken.usuario.nombre;

    this.pedidoRepartidorService.cleanLocal();

    console.log('aaa');

    if (!IS_NATIVE) { return; }
    PushNotifications.requestPermissions().then(result => {
      console.log('result.receive', result.receive);
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register()        
      } else {
        // Show some error
        console.log('error al registrar');
      }
    });    
     
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: Token) => {        
        console.log('addListener token.value ', token.value);
        this.pushNotificationService.saveSuscripcion(token.value);
      }
    );    

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error en registrar: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    // PushNotifications.addListener('pushNotificationReceived',
    //   (notification: PushNotificationSchema) => {
    //     alert('Push received: ' + JSON.stringify(notification));
    //   }
    // );

    // Method called when tapping on a notification
    // PushNotifications.addListener('pushNotificationActionPerformed',
    //   (notification: ActionPerformed) => {
    //     alert('Push action performed: ' + JSON.stringify(notification));
    //   }
    // );

  }

  async aceptarNotificacion() {
    if (!IS_NATIVE) {
      try {
        if ( await this.pushNotificationService.getIsTienePermiso()) {
          this.pushNotificationService.suscribirse();
        }

      } 
      catch (error) {
      }
    }

    this.isOnNotificactionPush = true;
    this.validConf();
  }

  // aceptarPosition() {
  //   this.geoPositionService.onGeoPosition();

  //   // setTimeout(() => {
  //   //   this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
  //   //   this.pushNotificationService.suscribirse();
  //   //   this.isOnGeoPosition = true;
  //   //   this.validConf();
  //   // }, 1500);
  // }

  aceptarPosition() {
    try {
      
      Geolocation.requestPermissions().then(() => {
        // Permisos de geolocalización aceptados
        // GPS activado
        this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
        // this.pushNotificationService.suscribirse();
        this.isOnGeoPosition = true;
        this.validConf();      
      }, (err) => {
        // Permisos de geolocalización rechazados
        // GPS no activado
        alert('Es necesario que active su ubicación (GPS)')

        this.geoPositionService.onGeoPosition();
  
        setTimeout(() => {
          this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
          this.pushNotificationService.suscribirse();
          this.isOnGeoPosition = true;
          this.validConf();
        }, 1500);
      });

    } catch (error) {
      // navegador
      this.geoPositionService.onGeoPosition();
  
      setTimeout(() => {
        this.isOnGeoPosition = this.geoPositionService.getGeoPosition().hasPermition;
        this.pushNotificationService.suscribirse();
        this.isOnGeoPosition = true;
        this.validConf();
      }, 1500);
    }

  }

  // aceptarPosition2() {
  //   Geolocation.getCurrentPosition().then(position => {
  //     alert(position);
  //   });
  // }

  private validConf() {
    this.isValid = this.isOnNotificactionPush && this.isOnGeoPosition;

    if ( this.isValid ) {

      setTimeout(() => {
        this.router.navigate(['./main']);
      }, 1400);

    }
  }

}
