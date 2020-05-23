import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { CrudHttpService } from './crud-http.service';
import { InfoTockenService } from './info-token.service';
import { VAPID_PUBLIC } from '../config/config.const';
// import { Observable } from 'rxjs/internal/Observable';
// import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
// import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';

@Injectable({
  providedIn: 'root'
})
export class NotificacionPushService {

  // private VAPID_PUBLIC = 'BC7ietauZE99Hx9HkPyuGVr8jaYETyEJgH-gLaYIsbORYobppt9dX49_K_wubDqphu1afi7XrM6x1zAp4kJh_wU';

  constructor(
    private swPush: SwPush,
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService,
    // private dialog: MatDialog,
  ) {

    // this.showMessages();

    this.swPush.notificationClicks.subscribe( event => {
      // const url = event.notification.data.url;
      window.location.reload();
    });
  }

  getIsTienePermiso(): boolean {
    return Notification.permission === 'granted' ? true : false;
  }


  // se suscribe a la notificacion
  suscribirse(): void {
    // console.log('llego a suscribirse estado this.swPush.isEnabled: ', this.swPush.isEnabled);
    // if ( this.swPush.isEnabled ) {
      // this.swPush.subscription.subscribe(res => {
        // if (!res) {return; }
        // this.lanzarPermisoNotificationPush(option);
        this.keySuscribtion();
      // });
    // }
  }

  //  suscriberse
  private keySuscribtion() {
    console.log('keySuscribtion');
    this.swPush
    .requestSubscription({
      serverPublicKey: VAPID_PUBLIC,
    })
    .then(subscription => {
      // send subscription to the server
      console.log('suscrito a notificaciones push', subscription);
      this.saveSuscripcion(subscription);
    })
    .catch(console.error);
  }

  private saveSuscripcion(_subscription: any): void {
    const _data = {
      suscripcion: _subscription,
      idcliente: this.infoTokenService.infoUsToken.idcliente
    };

    this.crudService.postFree(_data, 'repartidor', 'push-suscripcion', true)
      .subscribe(res => console.log(res));
  }

  // private lanzarPermisoNotificationPush(option: number = 0) {
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;
  //   _dialogConfig.data = {idMjs: option};

  //   console.log('show dialog DialogDesicionComponent');
  //   const dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
  //   dialogReset.afterClosed().subscribe(result => {
  //     if (result ) {
  //       console.log('result dialog DialogDesicionComponent', result);
  //       // this.suscribirse();
  //       this.keySuscribtion();
  //     }
  //   });
  // }


  // showMessages() {

  //   // this.swPush.messages
  //   //   .subscribe(message => {

  //   //     console.log('[App] Push message received', message);

  //   //     // let notification = message['notification'];

  //   //     // this.tweets.unshift({
  //   //     //   text: notification['body'],
  //   //     //   id_str: notification['tag'],
  //   //     //   favorite_count: notification['data']['favorite_count'],
  //   //     //   retweet_count: notification['data']['retwe<et_count'],
  //   //     //   user: {
  //   //     //     name: notification['title']
  //   //     //   }
  //   //     // })

  //   //   });

  // }

  // onNotification() {
  //   this.swPush.messages
  // }

}
