import { Injectable } from '@angular/core';
import { Auth0Service } from './auth0.service';
import { CrudHttpService } from './crud-http.service';
// import { Subject } from 'rxjs/internal/Subject';
// import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';

@Injectable({
  providedIn: 'root'
})
export class VerifyAuthClientService {

  public clientSocket: SocketClientModel;
  private subjectClient = new Subject<any>();
  private isClientValid = false;

  // private subjectClientSource = new BehaviorSubject<any>(null);
  // public subjectClient$ = this.subjectClientSource.asObservable();

  constructor(
    private auth: Auth0Service,
    private crudService: CrudHttpService
  ) { }

  isLogin(): boolean {
    return this.auth.loggedIn;
  }

  setIdOrg(val: number): void {
    this.clientSocket.idorg = val;
    this.setDataClient();
  }

  setIdSede(val: number): void {
    this.clientSocket.idsede = val;
    this.setDataClient();
  }

  setMesa(val: number): void {
    this.clientSocket.numMesaLector = val;
    this.setDataClient();
  }

  setIsSoloLLevar(val: boolean): void {
    this.clientSocket.isSoloLLevar = val;
    this.setDataClient();
  }

  setQrSuccess(val: boolean): void {
    this.clientSocket.isQrSuccess = val;
    this.setDataClient();
  }

  setIsDelivery(val: boolean): void {
    this.clientSocket.isDelivery = val;
    this.setDataClient();
  }

  setDireccionDeliverySelected(val: DeliveryDireccionCliente): void {
    this.clientSocket.direccionEnvioSelected = val;
    this.setDataClient();
  }

  setIsLoginByDNI(val: boolean): void {
    this.clientSocket.isLoginByDNI = val;
    this.setDataClient();
  }

  setTelefono(val: string) {
    this.clientSocket.telefono = val;
    this.setDataClient();
  }

  getIsLoginByDNI(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isLoginByDNI || false;
  }

  getIsQrSuccess(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isQrSuccess || false;
  }


  getIsDelivery(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isDelivery || false;
  }

  verifyClient(): Observable<any> {
    this.getDataClient();

    // verrifica si esta logueado
    if ( this.clientSocket.isLoginByDNI ) {
      // verifica y registra el cliente en la bd
      this.registerCliente();
      return this.subjectClient.asObservable();
    }

    this.auth.userProfile$.subscribe(res => {
      if ( !res ) {
        // this.clientSocket = new SocketClientModel();
        // this.setDataClient();
        // // console.log(this.clientSocket);

        this.subjectClient.next(null);
      } else {

        this.clientSocket.datalogin = res;
        // console.log(this.clientSocket);
        this.setDataClient();

        // verifica y registra el cliente en la bd
        this.registerCliente();
      }


      // guarda vista demostracion para no cargar nuevamente

      //
    }, (error) => {
      console.log(error);
    }, () => { console.log('complete'); });

    return this.subjectClient.asObservable();

  }

  private registerCliente(): void {
    let idClient = 0;
    this.crudService.postFree(this.clientSocket, 'ini', 'register-cliente-login', false).subscribe((rpt: any) => {
      // console.log('idcliente', rpt);
      // login en backend
      idClient = rpt.data[0].idcliente;
      this.clientSocket.idcliente = idClient;
      this.clientSocket.nombres = this.clientSocket.datalogin.name;
      this.clientSocket.usuario = this.clientSocket.datalogin.given_name;
      this.clientSocket.isCliente = true;
      this.clientSocket.telefono = rpt.data[0].telefono;
      this.clientSocket.efectivoMano = 0;

      // guarda en el usuario temporal
      // console.log(this.clientSocket);
      this.setDataClient();
      // window.localStorage.setItem('sys::tpm', JSON.stringify(this.clientSocket));

      this.subjectClient.next(this.clientSocket);
    });
  }

  setDataClient(): void {
    const dataClie = JSON.stringify(this.clientSocket);
    localStorage.setItem('sys::tpm', btoa(dataClie));
  }

  getDataClient(): SocketClientModel {
    const dataClie = localStorage.getItem('sys::tpm');
    if ( !dataClie ) { this.clientSocket = new SocketClientModel(); } else { this.clientSocket = JSON.parse(atob(dataClie)); }
    return this.clientSocket;
  }


  loginOut(): void {
    this.auth.logout();
    localStorage.removeItem('sys::tpm');
  }

  unsubscribeClient(): void {
    this.subjectClient.unsubscribe();
  }
}
