import { Component, OnInit, OnDestroy } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/internal/operators/take';

@Component({
  selector: 'app-callback-auth',
  templateUrl: './callback-auth.component.html',
  styleUrls: ['./callback-auth.component.css']
})
export class CallbackAuthComponent implements OnInit, OnDestroy {
  isProcesando = true;

  private dataTpm: any;

  private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private authService: AuthService,
    private infoToken: InfoTockenService
    ) { }

  ngOnInit() {

    // this.verifyClientService.verifyClient();

    this.veryfyClient = this.verifyClientService.verifyClient()
      .subscribe(res => {
        if ( !res ) {return; }
        this.isProcesando = false;
        // console.log('res idcliente', res);
        this.setInfoToken(res);
      });
  }

  ngOnDestroy(): void {
    this.veryfyClient.unsubscribe();
  }

  private setInfoToken(token: any): void {
    const _token = `eyCJ9.${btoa(JSON.stringify(token))}`;
    this.authService.setLocalToken(_token);
    this.authService.setLoggedStatus(true);
    this.infoToken.converToJSON();

    if ( !this.infoToken.infoUsToken.direccionEnvioSelected && this.infoToken.isDelivery()) {
      this.verifyClientService.setIsDelivery(true);
      this.router.navigate(['./zona-delivery']);
    } else {
      this.router.navigate(['./pedido']);
    }
  }

}
