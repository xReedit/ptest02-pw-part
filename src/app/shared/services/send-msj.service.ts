import { Injectable } from '@angular/core';
import { TimeLinePedido } from 'src/app/modelos/time.line.pedido';
import { InfoTockenService } from './info-token.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class SendMsjService {

  elRepartidor
  constructor(
    private socketService: SocketService,
    private infoToken: InfoTockenService,
  ) { }

  // mensaje al cliente y actualiza timelime_en
  msjClienteTimeLine(p: any, time_line_pedido: TimeLinePedido) {
    let listClienteNotificar = [];
    this.elRepartidor = this.infoToken.getInfoUs().usuario

    const rowDatos = p?.json_datos_delivery?.p_header?.arrDatosDelivery;
      if ( rowDatos ) {
        const rowCliente = {
          nombre: rowDatos.nombre.split(' ')[0],
          telefono: rowDatos.telefono,
          establecimiento: rowDatos.establecimiento.nombre,
          idpedido: p.idpedido,
          repartidor_nom: this.elRepartidor.nombre.split(' ')[0],
          repartidor_telefono: this.elRepartidor.telefono,
          repartidor_id: this.elRepartidor.idrepartidor, // update timeline
          time_line: time_line_pedido, // update timeline
          tipo_msj: time_line_pedido.paso // paso mensaje
        };

        listClienteNotificar.push(rowCliente);
      }
    
    if ( listClienteNotificar.length > 0 ) {
      this.socketService.emit('repartidor-notifica-cliente-time-line', listClienteNotificar);
    }
  }

}
