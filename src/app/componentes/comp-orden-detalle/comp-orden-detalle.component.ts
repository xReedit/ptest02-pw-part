import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PedidoRepartidorService } from 'src/app/shared/services/pedido-repartidor.service';

@Component({
  selector: 'app-comp-orden-detalle',
  templateUrl: './comp-orden-detalle.component.html',
  styleUrls: ['./comp-orden-detalle.component.css']
})
export class CompOrdenDetalleComponent implements OnInit {
  @Input() orden: any;
  @Output() closeWindow = new EventEmitter<boolean>(false); // manda cerrar el dialog

  constructor(
    private pedidoRepartidorService: PedidoRepartidorService
  ) { }

  ngOnInit(): void {
    this.pedidoRepartidorService.darFormatoLocalPedidoRepartidorModel(this.orden);
    // this.pedidoRepartidorService.pedidoRepartidor = this.orden;
    this.pedidoRepartidorService.setLocal();

    console.log('orden', this.orden);
  }

  cerrarDetalles(val: boolean) {
    if ( val ) {
      this.closeWindow.emit(val);
    }
  }

}
