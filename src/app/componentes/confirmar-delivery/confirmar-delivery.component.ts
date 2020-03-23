import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogMetodoPagoComponent } from '../dialog-metodo-pago/dialog-metodo-pago.component';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
// import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DialogVerificarTelefonoComponent } from '../dialog-verificar-telefono/dialog-verificar-telefono.component';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';


@Component({
  selector: 'app-confirmar-delivery',
  templateUrl: './confirmar-delivery.component.html',
  styleUrls: ['./confirmar-delivery.component.css']
})
export class ConfirmarDeliveryComponent implements OnInit {

  infoEstablecimiento: DeliveryEstablecimiento;
  infoToken: UsuarioTokenModel;
  direccionCliente: DeliveryDireccionCliente;
  metodoPagoSelected: MetodoPagoModel;
  isValidForm = false;
  rippleColor = 'rgb(255,238,88, 0.3)';

  montoMinimoPedido = 10; // monto minimo del pedido

  // return for printer
  private resData = {
    idcliente: '',
    dni: '',
    nombre: '',
    f_nac: '',
    direccion: '',
    telefono: '',
    paga_con: '',
    dato_adicional: '',
    referencia: ''
  };

  _listSubtotales: any;

  @Input()
  set listSubtotales(val: any) {
    this._listSubtotales = val;
    this.loadData();
  }


  @Output() isReady = new EventEmitter<boolean>();
  @Output() dataDelivery = new EventEmitter<any>();

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private establecimientoService: EstablecimientoService,
    private dialog: MatDialog,
    private dialogTelefono: MatDialog,
    // private crudService: CrudHttpService
  ) { }

  ngOnInit() {
    this.loadData();

    this.metodoPagoSelected = this.infoTokenService.infoUsToken.metodoPago;
  }

  private loadData(): void {
    // direccion de entrega
    this.infoToken = this.infoTokenService.getInfoUs();
    this.direccionCliente = this.infoToken.direccionEnvioSelected;
    console.log('info cliente from confirmacion', this.infoToken);

    // establecimiento seleccionado
    this.infoEstablecimiento = this.establecimientoService.get();

    this.isValidForm = this.infoToken.telefono ? this.infoToken.telefono.length >= 5 ? true : false : false;
    if ( this.isValidForm ) {
      setTimeout(() => {
        // this.isReady.emit(this.isValidForm);
        // this.dataDelivery.emit(this.resData);
        this.verificarNum(this.infoToken.telefono);
      }, 500);
    }
  }

  verificarNum(telefono: string): void {
    this.isValidForm = telefono.trim().length >= 5 ? true : false;
    this.isReady.emit(this.isValidForm);

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.referencia = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe ;
      this.resData.telefono = telefono;
      this.infoToken.telefono = telefono;
      this.infoTokenService.setTelefono(telefono);

      this.dataDelivery.emit(this.resData);
    }

    this.verificarMontoMinimo();
  }

  private verificarMontoMinimo() {
    const importeTotal = parseInt(this._listSubtotales[0].importe, 0);
    this.isValidForm = importeTotal >= this.montoMinimoPedido && this.isValidForm ? true : false;
    this.isReady.emit(this.isValidForm);

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.referencia = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe ;
      this.resData.telefono = this.infoToken.telefono;
      // this.infoToken.telefono = telefono;
      // this.infoTokenService.setTelefono(telefono);

      this.dataDelivery.emit(this.resData);
    }
  }

  openDialogMetodoPago(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    _dialogConfig.data = {
      importeTotalPagar: this._listSubtotales[this._listSubtotales.length - 1].importe
    };

    const dialogLoading = this.dialog.open(DialogMetodoPagoComponent, _dialogConfig);
      dialogLoading.afterClosed().subscribe((result: MetodoPagoModel) => {
        this.metodoPagoSelected = result;
        // console.log(result);
        this.verificarMontoMinimo();
      });
  }

  openDialogsendSMS() {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = 'my-full-screen-dialog';
    _dialogConfig.data = {
      idcliente: this.infoTokenService.infoUsToken.idcliente,
      numberphone: '+51934746830'
    };

    const dialogRefTelefono = this.dialogTelefono.open(DialogVerificarTelefonoComponent, _dialogConfig);

    dialogRefTelefono.afterClosed().subscribe((result: any) => {
      this.isValidForm = result.verificado;
      if ( result.verificado ) {
        this.infoToken.telefono = result.numberphone;
        this.infoTokenService.setTelefono(result.numberphone);
        this.verifyClientService.setTelefono(result.numberphone);
      }
      this.verificarMontoMinimo();
      // console.log(result);
    });

  }
}

