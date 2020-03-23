import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';

@Component({
  selector: 'app-seleccionar-direccion',
  templateUrl: './seleccionar-direccion.component.html',
  styleUrls: ['./seleccionar-direccion.component.css']
})
export class SeleccionarDireccionComponent implements OnInit {
  private infoClienteLogueado: any;
  listDirecciones: DeliveryDireccionCliente[];

  @Output() direccionSelected = new EventEmitter<DeliveryDireccionCliente>();

  constructor(
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit() {
    this.infoClienteLogueado = this.verifyClientService.getDataClient();
    // console.log(this.infoClienteLogueado);

    this.loadDireccion();
  }

  loadDireccion() {
    const _dataClientDir = {
      idcliente : this.infoClienteLogueado.idcliente
    };

    // console.log(_dataClientDir);

    this.crudService.postFree(_dataClientDir, 'delivery', 'get-direccion-cliente', false)
      .subscribe((res: any) => {
        // console.log('direcciones', res);
        this.listDirecciones = res.data;

        // si solo hay una direccion selecciona
        if (this.listDirecciones.length === 1 && this.infoClienteLogueado.direccionEnvioSelected === null ) {
          this.direccionSelected.emit(this.listDirecciones[0]);
        }
      });
  }

  selected(item: DeliveryDireccionCliente) {
    this.direccionSelected.emit(item);
  }

}
