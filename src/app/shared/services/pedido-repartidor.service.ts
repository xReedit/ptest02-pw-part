import { Injectable } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { CrudHttpService } from './crud-http.service';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Injectable({
  providedIn: 'root'
})
export class PedidoRepartidorService {
  pedidoRepartidor: PedidoRepartidorModel;
  keyLocal = 'sys::pr';

  constructor(
    private crudService: CrudHttpService
  ) {
    this.init();
  }

  init() {
    this.pedidoRepartidor = this.getLocal();
  }


  setPasoVa(val: number) {
    this.pedidoRepartidor.paso_va = val;
    this.setLocal(this.pedidoRepartidor);
  }

  setCostoSercicio(val: string) {
    this.pedidoRepartidor.c_servicio = val;
    this.setLocal(this.pedidoRepartidor);
  }

  setImporteTotalPedido(val: string) {
    this.pedidoRepartidor.importePedido = val;
    this.setLocal(this.pedidoRepartidor);
  }

  setIsHayPropina(val: boolean) {
    this.pedidoRepartidor.isHayPropina = val;
    this.setLocal(this.pedidoRepartidor);
  }

  setLocal(obj = null) {
    obj = obj ? obj : this.pedidoRepartidor;
    localStorage.setItem(this.keyLocal, btoa(JSON.stringify(obj)));
  }

  getLocal(): PedidoRepartidorModel {
    const rpt = localStorage.getItem(this.keyLocal);
    return rpt ? JSON.parse(atob(rpt)) : new PedidoRepartidorModel;
  }

  asignarPedido(): void {
    const _data = {
      idpedido: this.pedidoRepartidor.idpedido
    };

    this.crudService.postFree(_data, 'repartidor', 'set-asignar-pedido', true)
      .subscribe(res => {
        this.pedidoRepartidor.estado = 1; // asignadp
        this.setPasoVa(1);
      });
  }

  playAudioNewPedido() {
    const audio = new Audio();
    audio.src = './assets/audio/Alarm04.wav';
    audio.load();
    audio.play();
  }

  // dar formato subtotales del pedido recibido
  // saca el importe total del pedido separando el importe del servicio de entrega
  darFormatoSubTotales(arrTotales: any) {
    this.init();
    const rowTotal = arrTotales[arrTotales.length - 1];
    // -2 = servicio deliver -3 = propina
    rowTotal.importe = arrTotales.filter(x => x.id !== -2 && x.id !== -3 && x.descripcion !== 'TOTAL').map(x => parseFloat(x.importe)).reduce((a, b) => a + b, 0);
    this.pedidoRepartidor.importePedido = rowTotal.importe;
    // this.setImporteTotalPedido(rowTotal.importe);
    // costo total del servico + prpina
    const costoServicio = parseFloat(arrTotales.filter(x => x.id === -2 || x.id === -3).map(x => parseFloat(x.importe)).reduce((a, b) => a + b, 0));
    this.pedidoRepartidor.c_servicio = costoServicio.toString();
    // this.setCostoSercicio(costoServicio.toString());

    const _isHayPropina = arrTotales.filter(x => x.id === -3)[0] ? true : false;
    // this.setIsHayPropina(_isHayPropina);
    this.pedidoRepartidor.isHayPropina = _isHayPropina;
    this.setLocal();
    // quitamos el importe del servicio

    return arrTotales.filter(x => x.id !== -2 && x.id !== -3);
  }


  // da formato al pedido, se utiliza para ver el detalle del pedido
  darFormatoPedido(res: any): any {
    const _miPedidoCuenta: PedidoModel = new PedidoModel();
    const c_tiposConsumo: TipoConsumoModel[] = [];


        res.data.map( (tp: any) => {
          let hayTpc = c_tiposConsumo.filter(x => x.idtipo_consumo === tp.idtipo_consumo)[0];
          if (!hayTpc) {
            hayTpc = new TipoConsumoModel;
            hayTpc.descripcion = tp.des_tp;
            hayTpc.idtipo_consumo = parseInt(tp.idtipo_consumo, 0);
            c_tiposConsumo.push(hayTpc);
          }
        });


        c_tiposConsumo.map((tp: TipoConsumoModel) => {
          res.data
            .filter((_tp: any) => _tp.idtipo_consumo === tp.idtipo_consumo)
            .map((_s: any, i: number) => {
              // let haySeccion = !tp.secciones ? null : tp.secciones.filter((s: SeccionModel) => s.idseccion.toString() === _s.idseccion.toString())[0];
              let haySeccion = tp.secciones.filter((s: SeccionModel) => s.idseccion.toString() === _s.idseccion.toString())[0];
              if (!haySeccion) {
                haySeccion = new SeccionModel;
                haySeccion.idseccion = _s.idseccion.toString();
                haySeccion.des = _s.des_seccion;
                haySeccion.sec_orden = _s.sec_orden;
                haySeccion.ver_stock_cero = 0;
                tp.count_items_seccion = i + 1;
                tp.secciones.push(haySeccion);
              }
            });
        });


         // items
    c_tiposConsumo.map((tp: TipoConsumoModel) => {
      tp.secciones.map((s: SeccionModel) => {
          res.data
          .filter((_tp: any) => _tp.idtipo_consumo.toString() === tp.idtipo_consumo.toString() && _tp.idseccion.toString() === s.idseccion.toString())
          .map((_i: any, i: number) => {
            const hayItem = new ItemModel;
            hayItem.des = _i.descripcion;
            hayItem.detalles = '';
            hayItem.iditem = _i.iditem;
            hayItem.idcarta_lista = _i.idcarta_lista;
            hayItem.idseccion = _i.idseccion;
            hayItem.isalmacen = _i.isalmacen;
            hayItem.cantidad_seleccionada = parseInt(_i.cantidad, 0);
            hayItem.precio = _i.punitario;
            hayItem.precio_print = parseFloat(_i.ptotal);
            hayItem.precio_total = parseFloat(_i.ptotal);
            hayItem.procede = _i.procede === '0' ? 1 : 0;
            hayItem.seccion = _i.des_seccion;
            hayItem.img = _i.img;
            hayItem.subitems_view = _i.subitems === 'null' || _i.subitems === '' || !_i.subitems ? [] : JSON.parse(_i.subitems);
            s.count_items = i + 1;

            s.items = s.items ? s.items : [];
            s.items.push(hayItem);
          });
        });
      });

      _miPedidoCuenta.tipoconsumo = c_tiposConsumo;
      return _miPedidoCuenta;
  }

}
