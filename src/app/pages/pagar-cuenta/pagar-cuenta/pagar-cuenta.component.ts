import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
// import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
// import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { ClientePagoModel } from 'src/app/modelos/cliente.pago.model';
import { RegistrarPagoService } from 'src/app/shared/services/registrar-pago.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';

// import * as botonPago from 'src/assets/js/boton-pago.js';

declare var pagar: any;

@Component({
  selector: 'app-pagar-cuenta',
  templateUrl: './pagar-cuenta.component.html',
  styleUrls: ['./pagar-cuenta.component.css']
})
export class PagarCuentaComponent implements OnInit, OnDestroy {
  estadoPedido: any = [];
  infoToken: UsuarioTokenModel;
  // socketClient: SocketClientModel;
  importe: number;
  isLoaderTransaction = false;
  isLoadBtnPago = false;
  isCheckTerminos = false;
  isTrasctionSuccess = false;
  isViewAlertTerminos = false;
  isViewAlertEmail = false;
  isEmailValid = true;
  isDisabledCheck = false; // desabilita el check de terminos
  isRequiredEmail = false;
  dataResTransaction: any = null;
  pagaConEefectivo = false;

  el_purchasenumber;

  countFin = 6;
  private intervalConteo = null;

  fechaTransaction = new Date();

  private listenKeyLoader = 'sys::transaction-load';
  private listenKeyData = 'sys::transaction-response';
  private timeListenerKeys: any;
  private unsubscribeEstado = new Subscription();

  private dataClientePago: ClientePagoModel = new ClientePagoModel();

  constructor(
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private listenStatusService: ListenStatusService,
    private estadoPedidoClienteService: EstadoPedidoClienteService,
    private socketService: SocketService,
    private crudService: CrudHttpService,
    private registrarPagoService: RegistrarPagoService,
    private utilService: UtilitariosService,
    private miPedidoService: MipedidoService,
    private dialog: MatDialog,
    private pushNotificationSerice: NotificacionPushService
    // private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit() {
    this.navigatorService.disableGoBack();
    this.infoToken = this.infoTokenService.getInfoUs();
    this.pagaConEefectivo = this.infoToken.metodoPago.idtipo_pago === 1 ? true : false;
    this.isTrasctionSuccess = this.pagaConEefectivo;

    // envia de frente a la respuesta
    if ( this.pagaConEefectivo ) {
      this.dataResTransaction = {
        error: false
      };
    }

    // marcador que ya pago, si actualiza cierra session
    if ( this.infoTokenService.infoUsToken.isPagoSuccess ) {
      if ( this.infoTokenService.isDelivery() ) {
        this.finDelivery();
      } else {
        this.actionAfterTransaction();
      }
    }
    // this.estadoPedidoClienteService.get();
    // this.socketClient = this.verifyClientService.getDataClient();
    this.listener();
    this.getEmailCliente();

    // console.log(this.infoToken);
    // console.log(this.importe);
    // console.log('cliente socket verify', this.socketClient);
  }

  ngOnDestroy(): void {
    this.unsubscribeEstado.unsubscribe();
  }

  private async listener() {

    if ( this.infoToken.isDelivery  ) {
      // el importe lo toma del localstorage
      const arrTotales = JSON.parse(atob(localStorage.getItem('sys::st')));
      console.log('total st ', arrTotales);
      this.estadoPedido.importe = parseInt(arrTotales[arrTotales.length - 1].importe, 0);
    } else {
      this.estadoPedido.importe = await this.estadoPedidoClienteService.getImporteCuenta();
    }

    console.log(this.estadoPedido.importe);

    // para proteger de los que actualizan luego de pagar
    if ( this.estadoPedido.importe === 0 || this.estadoPedido.importe === null) {
      this.cerrarSession();
    }
    // this.unsubscribeEstado = this.listenStatusService.estadoPedido$.subscribe(res => {
    //   this.estadoPedido = res;
    // });

    // aveces la conexion se pierde, verificar para volver a conectar
    this.socketService.connect();

    // marcar como si se dio btn pago para reload page
    localStorage.setItem('sys::btnP', '0');
  }

  private cerrarSession(): void {
    this.navigatorService.cerrarSession(this.isCheckTerminos);
    // this.miPedidoService.cerrarSession();
    this.infoTokenService.cerrarSession();

    // para cargar nuevamente al ingresar
    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
  }

  // obtener datos del clienteP
  private getEmailCliente(): void {
    const dataClient = {
      id: this.infoToken.idcliente
    };

    this.crudService.postFree(dataClient, 'transaction', 'get-email-client', false).subscribe((res: any) => {
      this.dataClientePago.email = res.data[0].correo ? res.data[0].correo : '';

      // this.dataClientePago.email = 'integraciones.visanet@necomplus.com'; // desarrollo
      // this.dataClientePago.email = 'review@cybersource.com';
      // this.dataClientePago.isSaveEmail = false;

      // email // comentar si es review@cybersource.com
      this.isRequiredEmail = this.dataClientePago.email === '' ?  true : false;
      this.isEmailValid = !this.isRequiredEmail;
      this.dataClientePago.isSaveEmail = this.isRequiredEmail;

      this.dataClientePago.idcliente = res.data[0].idcliente_card;
      this.dataClientePago.diasRegistrado = res.data[0].dias_registrado;
      this.dataClientePago.nombres = this.infoToken.nombres;


      // ip del client
      this.dataClientePago.ip = this.infoToken.ipCliente;
      if ( !this.dataClientePago.ip ) {
        this.crudService.getFree('https://api.ipify.org?format=json').subscribe((_res: any) => {
          this.dataClientePago.ip = _res.ip;
          this.infoTokenService.setLocalIpCliente(this.dataClientePago.ip);
          this.isDisabledCheck = true;
        });
      } else {
        this.isDisabledCheck = true;
      }

      this.getNomApClientePago(this.dataClientePago.nombres);

    });
  }

  // dividi nombre y apellidos
  private getNomApClientePago(nombres: string): void {
    const _names = nombres.split(' ');
    let nameCliente = '';
    let apPaternoCliente = '';
    switch (_names.length) {
      case 1:
        nameCliente = _names[0];
        break;
      case 2:
        nameCliente = _names[0];
        apPaternoCliente = _names[1];
        break;
      case 3:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
      case 4:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
    }

    this.dataClientePago.nombre = this.utilService.primeraConMayusculas(nameCliente);
    this.dataClientePago.apellido = this.utilService.primeraConMayusculas(apPaternoCliente);

    // console.log('data cleinte pago', this.dataClientePago);

  }

  goPagar() {
    this.isViewAlertEmail = false;
    this.isViewAlertTerminos = false;
    this.isCheckTerminos = !this.isCheckTerminos;

    const _pase = this.isCheckTerminos && this.isEmailValid;

    if ( !_pase ) {
      this.isViewAlertEmail = true;
      this.isViewAlertTerminos = true; // comentar si review@cybersoruce.com
      return;
     }

    this.isLoadBtnPago = true;
    this.generarPurchasenumber();
  }

  goBack() {
    this.navigatorService.disabledBack = false;
    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
    this.navigatorService._router('../pedido');
    // this.listenStatusService.setIsPagePagarCuentaShow(false);
  }

  generarPurchasenumber() {
    this.crudService.getAll('transaction', 'get-purchasenumber', false, false, false).subscribe((res: any) => {
      const _purchasenumber = res.data[0].purchasenumber;
      this.el_purchasenumber = _purchasenumber;

      console.log('_purchasenumber', _purchasenumber);

      pagar(this.estadoPedido.importe, _purchasenumber, this.dataClientePago);
      this.listenResponse();
      this.verificarCheckTerminos();

      this.listenStatusService.setIsBtnPagoShow(true);

      // marcar como si se dio btn pago para reload page
      localStorage.setItem('sys::btnP', '1');
    });

  }

  private listenResponse() {
    this.timeListenerKeys = setTimeout(() => {
      const dataResponse = localStorage.getItem(this.listenKeyData);
      this.isLoaderTransaction = localStorage.getItem(this.listenKeyLoader) === '0' ? false : true;


      let _dataTransactionRegister;

      if ( dataResponse !== 'null' ) {
        this.isLoadBtnPago = false;
        console.log('dataResponse', dataResponse);
        this.dataResTransaction = JSON.parse(dataResponse);

        this.isTrasctionSuccess = !this.dataResTransaction.error;

        if (this.isTrasctionSuccess) {
          // registrar pago
          // const _dataTransactionRegister = {
          //   purchaseNumber: this.dataResTransaction.order.purchaseNumber,
          //   card: this.dataResTransaction.dataMap.CARD,
          //   brand: this.dataResTransaction.dataMap.BRAND,
          //   descripcion: this.dataResTransaction.dataMap.ACTION_DESCRIPTION
          // };

          _dataTransactionRegister = {
            purchaseNumber: this.dataResTransaction.order.purchaseNumber,
            card: this.dataResTransaction.dataMap.CARD,
            brand: this.dataResTransaction.dataMap.BRAND,
            descripcion: this.dataResTransaction.dataMap.ACTION_DESCRIPTION,
            status: this.dataResTransaction.dataMap.STATUS,
            error: this.dataResTransaction.error
          };

          // notifica a resumen para enviar el pedido
          // if ( this.infoToken.isSoloLLevar ) {
          //   this.listenStatusService.setPagoSuccess(true);
          // }

          // cuando es Cliente Delivery
          // guarda primero el pedido
          if ( this.infoToken.isDelivery ) {
            this.isLoaderTransaction = true;
            const _dataSendPedido = JSON.parse(atob(this.infoToken.orderDelivery));
            this.socketService.emit('nuevoPedido', _dataSendPedido);

            setTimeout(() => {
              this.isLoaderTransaction = false;
              this.registrarPagoService.registrarPago(this.estadoPedido.importe.toString(), _dataTransactionRegister, this.dataClientePago);

              // marcador si actualiza la pagina cuando ya pago
              this.infoTokenService.setIsPagoSuccess(true);
              return;
            }, 1900);
          } else {
            this.infoTokenService.setIsPagoSuccess(true);
            this.registrarPagoService.registrarPago(this.estadoPedido.importe.toString(), _dataTransactionRegister, this.dataClientePago);
          }


        } else {
          _dataTransactionRegister = {
            purchaseNumber: this.el_purchasenumber,
            card: this.dataResTransaction.data.CARD,
            brand: this.dataResTransaction.data.BRAND,
            descripcion: this.dataResTransaction.data.ACTION_DESCRIPTION,
            status: this.dataResTransaction.data.STATUS,
            error: this.dataResTransaction.error
          };

          this.registrarPagoService.registrarPago(this.estadoPedido.importe.toString(), _dataTransactionRegister, this.dataClientePago);
        }

          // cuenta para cerrar
          // this.cuentaRegresiva();
        // }

      } else {
        this.listenResponse();
      }
    }, 100);
  }

  verificarCheckTerminos() {
    this.isViewAlertTerminos = this.isCheckTerminos ? false : true;
    this.isViewAlertEmail = !this.isEmailValid; // comentar si review@cybersoruce.com
  }

  verificarCorreo(el: any): void {
    this.isEmailValid = el.checkValidity();
    this.isViewAlertEmail = !this.isEmailValid;
    this.dataClientePago.email = el.value;
  }

  private cuentaRegresiva() {
    if ( this.countFin <= 0 ) {
      this.intervalConteo = null;
      this.actionAfterTransaction();
    } else {
      this.conteoFinEncuesta();
    }
  }

  private conteoFinEncuesta(): void {
    this.intervalConteo =  setTimeout(() => {
      this.countFin --;
      this.cuentaRegresiva();
    }, 1000);
  }

  private actionAfterTransaction(): void {
    this.lanzarPermisoNotificationPush(1);
    if ( this.dataResTransaction.error ) {
      this.navigatorService._router('../pedido');
    } else {
      if ( this.infoToken.isSoloLLevar ) {
        this.goBack();
        // this.navigatorService._router('../pedido');
      } else {
        this.navigatorService._router('../lanzar-encuesta');
      }
    }
  }

  finDelivery() {

    this.lanzarPermisoNotificationPush(0);

    // limpiar storage transaccion
    this.miPedidoService.prepareNewPedido();
    this.infoTokenService.cerrarSession();

    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();

    this.navigatorService._router('../zona-delivery');

  }

  private lanzarPermisoNotificationPush(option: number = 0) {
    // this.pushNotificationSerice.suscribirse(option);

    if ( this.pushNotificationSerice.getIsTienePermiso() ) {
      this.pushNotificationSerice.suscribirse();
      return;
    }

    // si no tiene permiso le pregunta
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = {idMjs: option};

    console.log('show dialog DialogDesicionComponent');
    const dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        console.log('result dialog DialogDesicionComponent', result);
        // this.suscribirse();
        this.pushNotificationSerice.suscribirse();
      }
    });
  }


}

