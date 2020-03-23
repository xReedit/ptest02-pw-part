import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';


@Component({
  selector: 'app-dialog-verificar-telefono',
  templateUrl: './dialog-verificar-telefono.component.html',
  styleUrls: ['./dialog-verificar-telefono.component.css']
})
export class DialogVerificarTelefonoComponent implements OnInit {

  data: any;
  isValidForm = false;
  isSendSMS = false;
  isNumberSuccess = 0;
  loader = 0;
  isVerificacionOk = false;
  constructor(
    private dialogRef: MatDialogRef<DialogVerificarTelefonoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private crudService: CrudHttpService
  ) {
    this.data = data;
   }

  ngOnInit() {

  }

  sendSMS() {
    this.isSendSMS = true;
    this.isNumberSuccess = 0;
    this.crudService.postSMS(this.data, 'delivery', 'send-sms-confirmation', true)
      .subscribe(res => {
        this.isNumberSuccess = res.msj ? 1 : 2;
        this.isSendSMS = res.msj;
        this.isValidForm = false;
      });
  }

  verificarCodigoSMS(val: string) {
    this.loader = 1;
    // this.isVerificacionOk = true;
    const _dataCod = {
      codigo: val
    };

    this.crudService.postFree(_dataCod, 'delivery', 'verificar-codigo-sms', false)
      .subscribe(res => {
        this.isVerificacionOk = res.data[0] ? true : false;
        setTimeout(() => {
          this.loader = this.isVerificacionOk ? 2 : 3;
          this.data.verificado = this.isVerificacionOk;
          // this.loader = 2;s
          console.log(res);
          setTimeout(() => {
            this.cerrarDlg();
          }, 1000);
        }, 1000);
      });
  }

  verificarNum(telefono: string): void {
    this.isValidForm = telefono.trim().length >= 5 ? true : false;
    this.data.numberphone = telefono;
    this.data.verificado = false;
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.data);
  }


}

