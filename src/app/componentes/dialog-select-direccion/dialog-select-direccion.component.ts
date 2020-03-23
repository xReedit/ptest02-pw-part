import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-dialog-select-direccion',
  templateUrl: './dialog-select-direccion.component.html',
  styleUrls: ['./dialog-select-direccion.component.css']
})
export class DialogSelectDireccionComponent implements OnInit {

  isShowAddDireccion = false;
  direccionSelected: DeliveryDireccionCliente;

  constructor(
    private dialogRef: MatDialogRef<DialogSelectDireccionComponent>,
    private listenService: ListenStatusService
  ) { }

  ngOnInit() {
  }

  setDireccion($event: DeliveryDireccionCliente) {
    // console.log($event);
    this.direccionSelected = $event;

    this.listenService.setChangeDireccionDelivery(this.direccionSelected);
    this.cerrarDlg();
  }

  showAddDireccion() {
    this.isShowAddDireccion = true;
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.direccionSelected);
  }

}
