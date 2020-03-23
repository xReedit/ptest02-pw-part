import { Component, OnInit } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { Router } from '@angular/router';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { Auth0Service } from 'src/app/shared/services/auth0.service';


@Component({
  selector: 'app-login-cliente',
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.css']
})
export class LoginClienteComponent implements OnInit {
  loadConsulta = false;
  isViewLoginDNI = false;
  isValidDNI = false;
  isDateBirthdayValid = false;
  isListDateSelect = false;
  isPaseOk = false;
  dataCliente: any;
  dataClienteSend: SocketClientModel = new SocketClientModel();
  msj_error = '';

  listViewDate: any = [];
  private listDay: any = [];
  private listMotnh: any = [];
  private listYear: any = [];
  private numDocumento = '';

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private auth: Auth0Service,
    private crudService: CrudHttpService,
  ) { }

  ngOnInit() {
    this.dataClienteSend = this.verifyClientService.getDataClient();
    // console.log('data cliente', this.dataClienteSend);
  }

  // goFb() {
  //   this.router.navigate(['/login-client']);
  // }

  goFb() {
    // tslint:disable-next-line:max-line-length
    this.auth.login('#', 'facebook');
    // window.open('https://m.facebook.com/login.php?skip_api_login=1&api_key=433734160901286&kid_directed_site=0&app_id=433734160901286&signed_next=1
    // &next=https%3A%2F%2Fm.facebook.com%2Fdialog%2Foauth%3Fdisplay%3Dtouch%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fdev
    // -m48s1pe2.auth0.com%252Flogin%252Fcallback%26scope%3Dpublic_profile%252Cemail%252Cuser_age_range%252Cuser_birthday%26state%3DXNLlXc5bBETMHz3ZsKjdrJN5Qg-m7tAs%26client_id%3D433734160901286%26ret%3Dlogin
    // %26fbapp_pres%3D0%26logger_id%3D0da22dc3-2e21-4512-9630-6755b932362e&cancel_url=https%3A%2F
    // %2Fdev-m48s1pe2.auth0.com%2Flogin%2Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state
    // %3DXNLlXc5bBETMHz3ZsKjdrJN5Qg-m7tAs%23_%3D_&display=touch&locale=es_ES&pl_dbl=0&refsrc=https%3A%2F%2Fm.facebook.com%2Fdialog%2Foauth&_rdr', '_self');
  }

  goGmail() {
    // tslint:disable-next-line:max-line-length
    this.auth.login('#', 'google-oauth2');
    // window.open('https://accounts.google.com/signin/oauth/identifier?client_id=503309244000-nuq1e4aq964rumajuuuh8jrr8hqj4ggj.apps
    // .googleusercontent.com&as=Gt8_kdS94yJ8-SSNJ_FvAw&destination=https
    // %3A%2F%2Fdev-m48s1pe2.auth0.com&approval_state=!ChRYak5ZSGpadUgxXzNqb3hhcGZUehIfczJlb1h3T2JGZU1VRUZvSEdUZHlJLTJOcDdqNy1SWQ%E2%88%99AJDr988AAAAAXh3sARBYEr4oYCKCWs9U5zUn4rvw6fZ7&oauthgdpr=1&
    // xsrfsig=ChkAeAh8T3hpGUbuZ88B9xbsKFXhx8WEy7mEEg5hcHByb3ZhbF9zdGF0ZRILZGVzdGluYXRpb24SBXNvYWN1Eg9vYXV0aHJpc2t5c2NvcGU&
    // flowName=GeneralOAuthFlow', '_self');
  }

  viewLoginDni(): void {
    this.isViewLoginDNI = !this.isViewLoginDNI;
  }

  buscarDNI(value: string) {
    if ( value.length < 8 || this.numDocumento === value ) { return; }

    this.isValidDNI = false;
    this.isListDateSelect = false;

    this.limpiarFrm();

    this.numDocumento = value;



    this.loadConsulta = true;
    // buscamos cliente en bd
    this.crudService.getConsultaRucDni('dni', this.numDocumento)
    .subscribe(
      (response) => {
          if ( !response.success ) {
            this.loadConsulta = false;
            this.isValidDNI = false;
            this.msj_error = 'Numero de documento no valido.';
            return;
          }

          this.loadConsulta = false;
          this.isValidDNI = true;
          this.dataCliente =  response.data;
          // console.log(response);
          this.getListDates();
        },
      (error) => {
          this.loadConsulta = false;
          this.isValidDNI = false;
          this.msj_error = 'No se encontro, intentelo nuevamente.';
          alert(error.message);
          // console.log(error.message);
        }
    );
  }

  private limpiarFrm(): void {
    this.listViewDate = [];
    this.listDay = [];
    this.listMotnh = [];
    this.listYear = [];
    this.isValidDNI = false;
    this.numDocumento = '';
    this.msj_error = '';
  }

  private getListDates(): void {
    const listDate = this.dataCliente.date_of_birthday.split('/');

    this.listViewDate = [];
    this.listDay = [];
    this.listMotnh = [];
    this.listYear = [];

    this.addListDate(this.listDay, listDate[0], 'dd');
    this.addListDate(this.listMotnh, listDate[1], 'mm');
    this.addListDate(this.listYear, listDate[2], 'yy');

    // console.log('listDay', this.listDay);
    // console.log('listMotnh', this.listMotnh);
    // console.log('listYear', this.listYear);

    // year
    let contador = 0;
    let _date = '';
    this.listViewDate.push({'fecha': this.dataCliente.date_of_birthday, selected: false});
    while (contador < 3) {
      _date = `${this.listDay[this.getRandomArbitrary(0, 2)]}/${this.listMotnh[this.getRandomArbitrary(0, 2)]}/${this.listYear[this.getRandomArbitrary(0, 2)]}`;
      this.listViewDate.push({'fecha': _date, selected: false});
      contador++;
    }

    this.listViewDate.sort(function(a, b) {return 0.5 - Math.random(); } );
    this.listViewDate.sort(function(a, b) {return 0.5 - Math.random(); } );

    // console.log('listViewDate', this.listViewDate);

  }

  private addListDate(list: any, _num: string, tipo: string): void {
    const num = parseInt(_num.toString(), 0);
    let numRamond = 0;
    list.push(this.ceroIzq(num));

    numRamond =  this.getRandomArbitrary(1, 4);

    let numAdd = this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond;
    numAdd = numAdd === num ? this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond : numAdd;

    list.push(this.ceroIzq(this.verificarNum(numAdd, tipo)));

    numRamond = this.getRandomArbitrary(1, 4);
    let numAdd2 = this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond;
    numAdd2 = numAdd === numAdd2 ? this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond : numAdd2;
    list.push(this.ceroIzq(this.verificarNum(numAdd2, tipo)));

    list.sort((a, b) => a + b);
  }

  private ceroIzq(num: number): string {
    return num < 10 ? '0' + num.toString() : num.toString();
  }

  private verificarNum(num: number, tipo: string): number {
    let rpt = num;
    switch (tipo) {
      case 'dd':
        rpt = num <= 0 || num > 31 ? this.getRandomArbitrary(1, 28) : num;
        break;
      case 'mm':
        rpt = num <= 0 || num > 12 ? this.getRandomArbitrary(1, 12) : num;
        break;
    }

    return rpt;
  }

  private getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  verificarDNI(item: any): void {
    this.listViewDate.map( (x: any) => x.selected = false);
    item.selected = true;

    this.isListDateSelect = true;
    this.isDateBirthdayValid = item.fecha === this.dataCliente.date_of_birthday;

    this.isPaseOk = this.isDateBirthdayValid;

    if (this.isPaseOk) {
      this.verifyClientService.clientSocket.datalogin = this.dataCliente;
      this.verifyClientService.clientSocket.datalogin.sub = 'dni|' + this.dataCliente.number;
      this.verifyClientService.clientSocket.datalogin.name = this.dataCliente.names + ' ' + this.dataCliente.first_name + ' ' + this.dataCliente.last_name;
      this.verifyClientService.clientSocket.datalogin.given_name = this.dataCliente.names ? this.dataCliente.names.indexOf(' ') > 0 ? this.dataCliente.names.split(' ')[0] : this.dataCliente.names : this.dataCliente.names;
      this.verifyClientService.setDataClient();
      this.verifyClientService.setIsLoginByDNI(true);
      this.auth.loggedIn = true;
      setTimeout(() => {
        this.router.navigate(['/callback-auth']);
      }, 2000);
    } else {
      this.limpiarFrm();
    }


    // console.log(item);
  }
}
