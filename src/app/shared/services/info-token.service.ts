import { Injectable } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';



@Injectable({
  providedIn: 'root'
})
export class InfoTockenService {
  infoUsToken: UsuarioTokenModel;
  constructor(
    // private miPedidoService: MipedidoService,
  ) {
    this.converToJSON();
  }

  getInfoUs(): UsuarioTokenModel {
    this.getLocalIpCliente();
    return this.infoUsToken;
  }

  saveToken(token: any) {
    localStorage.setItem('::token', token);

    // guardo tambien la hora que esta iniciando session
    const ms_tieme_init_session = new Date().getTime();
    localStorage.setItem('sys::numtis', ms_tieme_init_session.toString());
  }

  getInfoSedeToken(): string {
    // const token = jwt.decode(this.getToken());
    return this.infoUsToken.idsede.toString();
    // return '1';
  }
  getInfoOrgToken(): string {
    return this.infoUsToken.idorg.toString();
  }

  getInfoNomSede(): string {
    return localStorage.getItem('sys::s');
  }

  isCliente(): boolean {
    return this.infoUsToken.isCliente;
  }

  isSoloLlevar(): boolean {
    return this.infoUsToken.isSoloLLevar;
  }

  isDelivery(): boolean {
    return this.infoUsToken.isDelivery;
  }

  getLocalIpCliente(): string {
    this.infoUsToken.ipCliente = localStorage.getItem('sys::it') || '';
    return this.infoUsToken.ipCliente;
  }

  setLocalIpCliente(val: string): void {
    localStorage.setItem('sys::it', val);
  }

  setIsPagoSuccess(val: boolean) {
    this.infoUsToken.isPagoSuccess = val;
    this.set();
  }

  // para el confirmar pago si es clienteDelivery
  setOrderDelivery(_order: string, _importes: string): void {
    this.infoUsToken.orderDelivery = btoa(_order);
    this.infoUsToken.importeDelivery = btoa(_importes);

    // const _token = `eyCJ9.${btoa(JSON.stringify(this.infoUsToken))}`;
    // localStorage.setItem('::token', _token);
    this.set();
  }

  setTelefono(val: string) {
    this.infoUsToken.telefono = val;
    this.set();
  }

  setMetodoPago( metodo: MetodoPagoModel) {
    this.infoUsToken.metodoPago = metodo;
    this.set();
  }

  setIniMetodoPago() {
    const metodoPagoInit: MetodoPagoModel = new MetodoPagoModel;
    metodoPagoInit.idtipo_pago = 2;
    metodoPagoInit.descripcion = 'Tarjeta';
    metodoPagoInit.importe = '0';
    metodoPagoInit.checked = true;

    this.setMetodoPago( metodoPagoInit );
  }

  setEfectivoMano( val: number) {
    this.infoUsToken.efectivoMano = val;
    this.set();
  }

  setisOnline( val: boolean) {
    this.infoUsToken.isOnline = val;
    this.set();
  }

  setSocketId( val: string) {
    // this.infoUsToken.socketId = this.infoUsToken.socketId ? this.infoUsToken.socketId : val;
    this.infoUsToken.socketId = val;
    this.set();
  }


  // guarda en el local storage
  set() {
    const _token = `eyCJ9.${btoa(JSON.stringify(this.infoUsToken))}`;
    localStorage.setItem('::token', _token);
  }
  //

  getToken(): any { return localStorage.getItem('::token'); } // este lo modificamos
  getTokenAuth(): any { return localStorage.getItem('::token-auth'); } // este se mantiene desde la session (original)

  converToJSON(): void {
    if (localStorage.getItem('::token')) {
      const _token =  JSON.parse(atob(localStorage.getItem('::token').split('.')[1]));

      // si existe idcliente, setea al usuario
      if ( _token.idcliente ) {
        const _newUs = new UsuarioTokenModel();
        _newUs.isCliente = true;
        _newUs.idcliente = _token.idcliente;
        _newUs.idorg = _token.idorg;
        _newUs.idsede = _token.idsede;
        _newUs.nombres = _token.datalogin ? _token.datalogin.name : _token.nombres ;
        _newUs.idusuario = 0;
        _newUs.usuario = 'cliente';
        _newUs.numMesaLector = _token.numMesaLector;
        _newUs.ipCliente = _token.ipCliente;
        _newUs.isSoloLLevar = _token.isSoloLLevar;
        _newUs.isDelivery = _token.isDelivery;
        _newUs.direccionEnvioSelected = _token.direccionEnvioSelected;
        _newUs.telefono = _token.telefono;
        _newUs.orderDelivery = _token.orderDelivery;
        _newUs.importeDelivery = _token.importeDelivery;
        _newUs.isPagoSuccess = _token.isPagoSuccess;
        _newUs.metodoPago = _token.metodoPago;
        _newUs.efectivoMano = _token.efectivoMano;
        _newUs.socketId = _token.socketId;
        this.infoUsToken = _newUs;

        // agregar el metodo pago prederteminado tarjeta
        if (!this.infoUsToken.metodoPago)  { this.setIniMetodoPago(); }
      } else {
        this.infoUsToken = <UsuarioTokenModel>_token;
        this.infoUsToken.isCliente = false;
      }
    } else {
      this.infoUsToken = null;
    }
  }

  cerrarSession(): void {
    localStorage.removeItem('::token');
    localStorage.removeItem('sys::rules');
    localStorage.removeItem('sys::status');
    localStorage.removeItem('sys::numtis');
    localStorage.removeItem('sys::st');

    localStorage.removeItem('token');
    localStorage.removeItem('sys::ed');
    localStorage.removeItem('sys::transaction-response');
    localStorage.removeItem('sys::transaction-load');
    localStorage.removeItem('data');
    // localStorage.removeItem('sys::tpm');
  }

  // verifica el tiempo de inactividad para cerrar session
  // cerrar session despues de 3:20 => ( 12000 sec )horas inciadas
  verificarContunuarSession(): boolean {
    if ( !this.infoUsToken || !this.infoUsToken.isCliente || !this.infoUsToken.isDelivery) { // si es usuario autorizado no cuenta tiempo
      return true;
    }
    const numTis = parseInt(localStorage.getItem('sys::numtis'), 0);
    let continueSession = !isNaN(numTis);

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    const ms_now = new Date().getTime();
    const ms = ms_now - numTis;
    const sec = Math.floor((ms / 1000));

    if ( sec > 10000 ) {
      continueSession = false;
    }

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    return true;
    // const timeAfter = localStorage.getItem('sys::tnum') ? parseInt(localStorage.getItem('sys::tnum'), 0) : ms_new;
  }
}
