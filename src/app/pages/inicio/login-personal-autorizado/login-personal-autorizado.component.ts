import { Component, OnInit } from '@angular/core';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-login-personal-autorizado',
  templateUrl: './login-personal-autorizado.component.html',
  styleUrls: ['./login-personal-autorizado.component.css']
})
export class LoginPersonalAutorizadoComponent implements OnInit {

  usuario: UsuarioAutorizadoModel;
  loading = false;
  msjErr = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private infoToken: InfoTockenService,
    ) { }

  ngOnInit() {
    this.usuario = new UsuarioAutorizadoModel();
  }

  logear(): void {
    this.loading = true;
    this.msjErr = false;

    this.usuario.op = 1;

    console.log('this.usuario', this.usuario);

    this.authService.setLocalToken('');
    this.authService.getUserLogged(this.usuario).subscribe(res => {
      setTimeout(() => {
        console.log('res');
        if (res.success) {
          const _t = res.token;
          this.authService.setTokenAuth(_t);
          this.authService.getInfoRepartidor(res.usuario).subscribe((response: any) => {
            this.authService.setLocalToken(response);
            this.authService.setLoggedStatus(true);
            this.authService.setLocalUsuario(this.usuario);
            this.infoToken.converToJSON();
            this.router.navigate(['./main-inicio']);
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
