import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RepartidorService } from 'src/app/shared/services/repartidor.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-dialog-change-pass',
  templateUrl: './dialog-change-pass.component.html',
  styleUrls: ['./dialog-change-pass.component.css']
})
export class DialogChangePassComponent implements OnInit {

  dataCliente: any = {};
  msj = '';
  loading = false;
  constructor(
    private dialogRef: MatDialogRef<DialogChangePassComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private repartidroService: RepartidorService,
    private infoToken: InfoTockenService
  ) { }

  ngOnInit(): void {
  }

  guardarClave() {
    this.msj = '';
    this.loading = true;
    if ( this.dataCliente.p1 === this.infoToken.getInfoUs().usuario.pass ) {
      this.repartidroService.guardarCamnioClave(this.dataCliente);
      setTimeout(() => {
        this.infoToken.getInfoUs().usuario.pass = this.dataCliente.p2;
        this.infoToken.set();
        this.loading = false;
        this.dialogRef.close();
      }, 1500);
    } else {
      this.msj = 'Contraseña actual no coicide';
      this.loading = false;
    }
  }

}
