// este servicio arma el json, que se envia para imprmir // print_setver_detalle

import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { MipedidoService } from './mipedido.service';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';

@Injectable({
  providedIn: 'root'
})
export class JsonPrintService {
  datosSede: any = [];

  private impresoras: any = [];


  constructor(private socketService: SocketService, private pedidoService: MipedidoService) {



  }

  // obtener los datos de la sede
  private getDataSede(): void {
    // this.socketService.onGetDatosSede().subscribe((res: any) => {
      // this.datosSede = res[0];
      this.datosSede = this.pedidoService.objDatosSede;
      // console.log('datos de la sede', this.datosSede);
    // });
  }

  // relacionar secciones con impresoras
  private relationRowToPrint(): void {

    // datos de la sede
    this.getDataSede();

    const _objMiPedido = this.pedidoService.getMiPedido();
    const xRptPrint: any = []; // respuesta para enviar al backend
    let xImpresoraPrint: any = []; // array de impresoras
    let xArrayBodyPrint: any = []; // el array de secciones e items a imprimir

    this.impresoras = <any[]>this.datosSede.impresoras;
    // valores de la primera impresora // impresora donde se pone el logo
    const num_copias_all = this.datosSede.datossede[0].num_copias; // numero de copias para las demas impresoras -local
    const var_size_font_tall_comanda = this.datosSede.datossede[0].var_size_font_tall_comanda; // tamañao de letras
    const pie_pagina = this.datosSede.datossede[0].pie_pagina;
    const pie_pagina_comprobante = this.datosSede.datossede[0].pie_pagina_comprobante;
    let isHayDatosPrintObj = true; // si hay datos en el obj xArrayBodyPrint para imprimir
    // let indexP = 0;
    this.impresoras.map((p: any) => {
      isHayDatosPrintObj = false;
      xArrayBodyPrint = [];
      _objMiPedido.tipoconsumo
        .map((tpc: TipoConsumoModel, indexP: number) => {
          xArrayBodyPrint[indexP] = { 'des': tpc.descripcion, 'id': tpc.idtipo_consumo, 'titlo': tpc.titulo, 'conDatos': false};
          tpc.secciones
            .filter((s: SeccionModel) => s.idimpresora === p.idimpresora)
            .map((s: SeccionModel) => {
              s.items.map((i: ItemModel) => {
                if (i.imprimir_comanda === 0) { return; } // no imprimir // productos bodega u otros
                  // xArrayBodyPrint[indexP][i.iditem] = [];
                  isHayDatosPrintObj = true;
                  xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                  xArrayBodyPrint[indexP][i.iditem] = i;
                  xArrayBodyPrint[indexP][i.iditem].des_seccion = s.des;
                  xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                  xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                  if ( !i.subitems_view ) {
                    xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                  }
                });
              });
              // indexP++;
          });


      if (xArrayBodyPrint.length === 0 || !isHayDatosPrintObj) { return; }

      xImpresoraPrint = [];
      const childPrinter: any = {};
      childPrinter.ip_print = p.ip;
      childPrinter.var_margen_iz = p.var_margen_iz;
      childPrinter.var_size_font = p.var_size_font;
      childPrinter.local = 0;
      childPrinter.num_copias = num_copias_all;
      childPrinter.var_size_font_tall_comanda = var_size_font_tall_comanda;
      childPrinter.copia_local = 0; // no imprime // solo para impresora local
      childPrinter.img64 = '';
      childPrinter.papel_size = p.papel_size;
      childPrinter.pie_pagina = pie_pagina;
      childPrinter.pie_pagina_comprobante = pie_pagina_comprobante;

      xImpresoraPrint.push(childPrinter);

      // console.log('xArrayBodyPrint', xArrayBodyPrint);
      // console.log('xImpresoraPrint', xImpresoraPrint);
      xRptPrint.push({
        arrBodyPrint: xArrayBodyPrint,
        arrPrinters: xImpresoraPrint
      });
    });

    return xRptPrint;



  }

  enviarMiPedido(): any {
    return this.relationRowToPrint();
  }
}
