import { Component, OnInit } from '@angular/core';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { StorageService } from 'src/app/shared/services/storage.service';


@Component({
  selector: 'app-login-personal-autorizado',
  templateUrl: './login-personal-autorizado.component.html',
  styleUrls: ['./login-personal-autorizado.component.css']
})
export class LoginPersonalAutorizadoComponent implements OnInit {

  usuario = new UsuarioAutorizadoModel();
  loading = false;
  msjErr = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private infoToken: InfoTockenService,
    private storageService: StorageService    
    ) { }

  ngOnInit() {
    this.usuario = new UsuarioAutorizadoModel();

    this.checkUserLogin()
    
  }

  private async checkUserLogin() {
    const userLogin = await this.storageService.getLoginUser();
    if ( userLogin ) {
      if (userLogin.recordar) {
        this.usuario = userLogin;
        this.logear(true);
      }
    }
  }

  logear(isLoginStorage = false): void {
    this.loading = true;
    this.msjErr = false;

    this.usuario.op = 1;

    // console.log('this.usuario', this.usuario);

    this.authService.setLocalToken('');
    this.authService.getUserLogged(this.usuario).subscribe(res => {
      setTimeout(() => {
        console.log('res');
        if (res.success) {

          this.storageService.setLoginUser(this.usuario);

          const _t = res.token;
          this.authService.setTokenAuth(_t);
          this.authService.getInfoRepartidor(res.usuario).subscribe((response: any) => {
            this.authService.setLocalToken(response);
            this.authService.setLoggedStatus(true);
            this.authService.setLocalUsuario(this.usuario);
            this.infoToken.converToJSON();
            if (!isLoginStorage) {
              this.router.navigate(['./main-inicio']);
            } else {
              this.router.navigate(['./main']);
            }
          });
          // this.loading = false;
        } else {
          this.loading = false;
          this.msjErr = true;
        }
      }, 2000);
    });
  }

}
