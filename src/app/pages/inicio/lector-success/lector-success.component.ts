import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { Auth0Service } from 'src/app/shared/services/auth0.service';
import { Router } from '@angular/router';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';

@Component({
  selector: 'app-lector-success',
  templateUrl: './lector-success.component.html',
  styleUrls: ['./lector-success.component.css']
})
export class LectorSuccessComponent implements OnInit {

  dataSede: any;
  listReglas: any;
  numMesa = 0;
  usLog: any;

  constructor(
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
    public auth: Auth0Service,
    private router: Router,
  ) { }

  ngOnInit() {
    this.loadDataIni();
    // // console.log(this.auth.userProfile$);
  }

  private loadDataIni(): void {
    // datos sede
    this.usLog = this.verifyClientService.getDataClient();
    const _data = {
      idsede: this.usLog.idsede
    };

    this.numMesa = this.usLog.numMesaLector;
    console.log(this.usLog);

    this.crudService.postFree(_data, 'ini', 'info-sede', false)
      .subscribe((res: any) => {
        this.dataSede = res.data[0];

        // datos para registrar luego de loguear
        // si existe usuario en el local storage actualiza nada mas sede e idorg
        // let dataTpm = JSON.parse(window.localStorage.getItem('sys::tpm'));
        this.verifyClientService.getDataClient();
        this.verifyClientService.setIdOrg(this.dataSede.idorg);
        this.verifyClientService.setIdSede(this.dataSede.idsede);

        // if ( !dataTpm ) {
        //   dataTpm = {
        //     idorg: this.dataSede.idorg,
        //     idsede: this.dataSede.idsede
        //   };
        // } else {
        //   dataTpm.idorg = this.dataSede.idorg;
        //   dataTpm.idsede = this.dataSede.idsede;
        // }

        // window.localStorage.setItem('sys::tpm', JSON.stringify(dataTpm));

        // console.log(this.dataSede);

        // reglas del app
        this.crudService.getAll('ini', 'reglas-app', false, false, false)
          .subscribe((resp: any) => {
            this.listReglas = resp.data.map((x: any) => {
              x.descripcion = x.descripcion.replace('?', this.dataSede.pwa_time_limit);
              return x;
            });
            // console.log('reglas', resp);
          });
      });

  }

  listoEmpezar(): void {
    if (this.auth.loggedIn || this.verifyClientService.getIsLoginByDNI()) {
      this.router.navigate(['/callback-auth']);
    } else {
      // this.auth.login();
      this.router.navigate(['/login-client']);
    }
  }

}
