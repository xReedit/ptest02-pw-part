import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { Router } from '@angular/router';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
import { StorageService } from 'src/app/shared/services/storage.service';
// import { take } from 'rxjs/internal/operators/take';
// import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit, OnDestroy {

  private veryfyClient: Subscription = null;

  isLogin = false;
  nombreClientSocket = '';

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private storageService: StorageService
    // private webSocketService: WebsocketService
    ) { }

  ngOnInit() {
    this.nombreClientSocket = '';
    screen.orientation.unlock();

    // setTimeout(() => {
      // this.loadInit();
    // }, 800);
    this.checkUserLogin()
    

    
  }

  private async checkUserLogin() {
    const userLogin = await this.storageService.getLoginUser();
    if ( userLogin ) {
      alert( `User ${JSON.stringify(userLogin)}`)
      this.router.navigate(['/login-personal-autorizado']);
    } else {
      // limpiar datos
      localStorage.clear();
    }
  }

  private loadInit(): void {
    this.verifyClientService.getDataClient();
    this.verifyClientService.setQrSuccess(false);
    this.verifyClientService.setIsDelivery(false);
    this.verifyClientService.setDireccionDeliverySelected(null);

    this.isLogin = this.verifyClientService.isLogin();
    // console.log('desde incio', this.isLogin);

    this.verifyClientService.setMesa(null);
    this.verifyClientService.setIdOrg(null);
    this.verifyClientService.setIdSede(null);
    this.veryfyClient = this.verifyClientService.verifyClient()
      .subscribe((res: SocketClientModel) => {
        this.nombreClientSocket = res.usuario;
        this.isLogin = this.verifyClientService.getIsLoginByDNI() ? true : this.verifyClientService.isLogin();
        this.verifyClientService.setQrSuccess(false);
        // console.log('res idcliente', res);
      });
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    // this.veryfyClient.unsubscribe();
  }

  // changeLenguage() {
  //   const elements = this.elem.nativeElement.querySelectorAll('.goog-te-combo');
  //   elements.value = 'es';
  // }

  cerrarSession(): void {
    this.verifyClientService.loginOut();
  }

  showClienteProfile() {
    if ( this.isLogin ) {
       this.router.navigate(['/cliente-profile']);
    }
  }

  showDelivery() {
    if (this.isLogin)  {
      this.router.navigate(['./zona-delivery']);
    } else {
      this.verifyClientService.setIsDelivery(true);
      this.router.navigate(['/login-client']);
    }
  }

}
