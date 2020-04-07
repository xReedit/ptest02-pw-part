import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';

@Component({
  selector: 'app-dialog-calificacion',
  templateUrl: './dialog-calificacion.component.html',
  styleUrls: ['./dialog-calificacion.component.css']
})
export class DialogCalificacionComponent implements OnInit {
  _dataCalificado: DatosCalificadoModel;
  constructor(
    // private dialogRef: MatDialogRef<DialogCalificacionComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this._dataCalificado = data.dataCalificado;
  }

  ngOnInit() {
  }

}
