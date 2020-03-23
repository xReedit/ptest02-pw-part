import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-reset',
  templateUrl: './dialog-reset.component.html',
  styleUrls: ['./dialog-reset.component.css']
})
export class DialogResetComponent implements OnInit {

  msj = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    // console.log('data dialog', data);
    const idMsj = data ? data.idMjs : 0;
    switch (idMsj) {
      case 0:
        this.msj = 'Confirma que desea de borrar el pedido actual?';
        break;
      case 1:
        this.msj = 'Confirma que desea salir?';
        break;
      case 2:
        this.msj = 'Solo puede hacer un pedido por establecimiento a la vez. Confirma que desea salir?';
        break;
    }
  }

  ngOnInit() {
  }

}
