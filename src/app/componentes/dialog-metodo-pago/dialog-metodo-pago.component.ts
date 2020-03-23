import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-dialog-metodo-pago',
  templateUrl: './dialog-metodo-pago.component.html',
  styleUrls: ['./dialog-metodo-pago.component.css']
})
export class DialogMetodoPagoComponent implements OnInit {

  // dialogResponse: MetodoPagoModel;
  listMetodoPago: any;
  isMontoVisible = false;
  formValid = false;
  importeIndicado: string;
  private itemSelected: MetodoPagoModel;
  private importeTotal: number;
  private importeValid = false;

  constructor(
    private dialogRef: MatDialogRef<DialogMetodoPagoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private infoTokenService: InfoTockenService,
  ) {
    this.importeTotal = parseInt(data.importeTotalPagar, 0);
  }

  ngOnInit() {

    this.loadMetodoPago();
    this.itemSelected = this.infoTokenService.infoUsToken.metodoPago;
    this.verificarMetodoInit();
  }

  private loadMetodoPago() {
    this.listMetodoPago = [];

    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 2, 'descripcion': 'Tarjeta', 'checked': true});
    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 1, 'descripcion': 'Efectivo', 'checked': false});
    console.log(this.listMetodoPago);
  }

  private verificarMetodoInit() {
    if ( this.itemSelected.idtipo_pago === 1 ) {
      this.isMontoVisible = true;
      this.importeIndicado = this.itemSelected.importe.toString();

      this.verificarImporte(this.importeIndicado);
    }
    this.listMetodoPago.map(x => {
      x.checked = x.idtipo_pago === this.itemSelected.idtipo_pago ? true : false;
    });
    this.verificarValidForm();

  }

  chageItem(item: MetodoPagoModel) {
    this.listMetodoPago.map(x => x.checked = false);
    this.isMontoVisible = false;
    this.importeValid = false;
    item.checked = true;
    this.itemSelected = item;

    if ( item.idtipo_pago === 1 ) {
      this.isMontoVisible = true;
      this.importeIndicado = '';
    }

    this.verificarValidForm();
  }

  verificarImporte(importe: string) {
    this.importeValid = parseInt(importe, 0) >= this.importeTotal;
    this.importeIndicado = importe;
    this.itemSelected.importe = this.importeIndicado;
    this.verificarValidForm();
  }

  private verificarValidForm() {
    this.formValid = this.itemSelected.idtipo_pago === 2 ? true : this.importeValid;
    console.log('verificado pago', this.formValid);
  }

  cerrarDlg(): void {
    this.infoTokenService.setMetodoPago( this.itemSelected );
    this.dialogRef.close(this.itemSelected);
  }

}
