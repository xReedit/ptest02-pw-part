import { Injectable } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { CrudHttpService } from './crud-http.service';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
// import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Observable } from 'rxjs/internal/Observable';
import { Router } from '@angular/router';
import { SocketService } from './socket.service';
import { InfoTockenService } from './info-token.service';
import { ListenStatusService } from './listen-status.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoRepartidorService {
  pedidoRepartidor: PedidoRepartidorModel;
  keyLocal = 'sys::pr';

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    private infoTokenService: InfoTockenService,
    private listenService: ListenStatusService,
    private socketService: SocketService
  ) {
    this.init();
  }

  init() {
    this.pedidoRepartidor = this.getLocal();
  }

  cleanLocal(): void {
    localStorage.removeItem(this.keyLocal);
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
    try {
      return rpt ? JSON.parse(atob(rpt)) : new PedidoRepartidorModel;
    } catch (error) {
      this.cleanLocal();
      return new PedidoRepartidorModel;

    }
  }

  asignarPedido(): void {
    const _data = {
      idpedido: this.pedidoRepartidor.idpedido
    };

    this.crudService.postFree(_data, 'repartidor', 'set-asignar-pedido', true)
      .subscribe(res => {
        this.pedidoRepartidor.estado = 1; // asignadp
        this.setLocal();
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
  darFormatoSubTotales(arrTotales: any = null) {
    this.init();
    arrTotales = arrTotales ? arrTotales : this.pedidoRepartidor.datosSubtotales;
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

    // cuanto paga el repartidor restando precio_default si el comercio no es afiliado



    this.setLocal();
    // quitamos el importe del servicio

    return arrTotales.filter(x => x.id !== -2 && x.id !== -3);
  }


  // da formato al pedido, se utiliza para ver el detalle del pedido
  darFormatoPedido(res: any): any {
    const _miPedidoCuenta: PedidoModel = new PedidoModel();
    const c_tiposConsumo: TipoConsumoModel[] = [];
    let subTotalDefault = 0;


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

            // precio total si el comercio no es afiliado muestra el precio default (sin comision para que el repartidor sepa el precio a pagar)
            const precio_default = parseFloat(_i.precio_default) * parseInt(_i.cantidad, 0);
            const p_unitario = _i.precio_default;
            subTotalDefault += precio_default;

            hayItem.des = _i.descripcion;
            hayItem.detalles = '';
            hayItem.iditem = _i.iditem;
            hayItem.idcarta_lista = _i.idcarta_lista;
            hayItem.idseccion = _i.idseccion;
            hayItem.isalmacen = _i.isalmacen;
            hayItem.cantidad_seleccionada = parseInt(_i.cantidad, 0);
            hayItem.precio = p_unitario;
            hayItem.precio_print = parseFloat(precio_default.toString());
            hayItem.precio_total = parseFloat(precio_default.toString());
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

      this.reCalcularSubTotal(subTotalDefault);

      return _miPedidoCuenta;
  }

  darFormatoPedidoLocal(pedidoLocal: PedidoModel): any {
    let subTotalDefault = 0;

    pedidoLocal.tipoconsumo.map(tp => {
      tp.secciones.map( s => {
       s.items.map( _i => {
         const precio_default = parseFloat(_i.precio_default) * _i.cantidad_seleccionada;
           const p_unitario = _i.precio_default;
           subTotalDefault += precio_default;

           _i.precio = p_unitario;
           _i.precio_print = parseFloat(precio_default.toString());
           _i.precio_total = parseFloat(precio_default.toString());
       });
     });
    });

    this.reCalcularSubTotal(subTotalDefault);
    return pedidoLocal;
  }

  // subTotal = recibido del default
  reCalcularSubTotal( subTotalDefault: number ) {
    this.init();
    const _rowSubTotal = this.pedidoRepartidor.datosSubtotales[0];
    // si el tototal es igual quiere decir de que no hay default comercio afiliado
    if ( subTotalDefault === parseFloat(_rowSubTotal.importe) ) { return; }
    const _diffSubTotal  = parseFloat(_rowSubTotal.importe) - subTotalDefault;
    _rowSubTotal.importe = subTotalDefault;

    // sumamos los totales
    const rowTotal = this.pedidoRepartidor.datosSubtotales.filter(x => x.descripcion === 'TOTAL')[0];

    // importe que pagara el cliente
    this.pedidoRepartidor.importePagaCliente = rowTotal.importe;


    rowTotal.importe = parseFloat(rowTotal.importe) - _diffSubTotal;

    // this.pedidoRepartidor.datosSubtotales =
    this.setLocal();
  }


  // verifica el estado del pedido
  // esto en inidicaciones por si se recarga o no llega la notificaion socket
  verificarEstadoPedido(idpedido: number) {
    return new Observable(observer => {
      const _dataSend = {
        idpedido: idpedido
      };
      this.crudService.postFree(_dataSend, 'repartidor', 'get-estado-pedido')
        .subscribe(res => {
          this.pedidoRepartidor.estado = res.data[0].pwa_delivery_status;
          observer.next(this.pedidoRepartidor.estado);
        });
    });
  }


  // fin de pedido // guarda datos del pedido
  finalizarPedido(): void {
    const comisionRepartidor = this.pedidoRepartidor.c_servicio;
    const propinaRepartidor = this.pedidoRepartidor.datosDelivery.propina.value;
    const costotalServicio = parseFloat(comisionRepartidor) + parseFloat(propinaRepartidor);

    // importeDepositar siempre y cuando el comercio no esta afiliado
    const importeDepositar = parseFloat(this.pedidoRepartidor.importePagaCliente) - (parseFloat(this.pedidoRepartidor.importePedido) + costotalServicio);

    const _dataSend = {
      idrepartidor: this.pedidoRepartidor.datosRepartidor.idrepartidor,
      idpedido: this.pedidoRepartidor.idpedido,
      idcliente: this.pedidoRepartidor.datosCliente.idcliente,
      idsede: this.pedidoRepartidor.datosComercio.idsede,
      operacion: {
        isrepartidor_propio: false,
        metodoPago: this.pedidoRepartidor.datosDelivery.metodoPago,
        importeTotalPedido: parseFloat(this.pedidoRepartidor.importePagaCliente),
        importePagadoRepartidor: this.pedidoRepartidor.importePedido, // (a)(b)
        comisionRepartidor: comisionRepartidor,
        propinaRepartidor: propinaRepartidor,
        costoTotalServicio: costotalServicio,
        importeDepositar: parseFloat(importeDepositar.toFixed()).toFixed(2) // (a)
        // importePagaRepartidor: parseFloat(this.pedidoRepartidor.datosDelivery.importeTotal),
      }
    };

    // (a) = cuando el comercio no esta afiliado el importe que el repartidor debe depositar
    // (b) = precios de los productos sin comision

    this.socketService.emit('repartidor-propio-notifica-fin-pedido', this.pedidoRepartidor);

    this.crudService.postFree(_dataSend, 'repartidor', 'set-fin-pedido-entregado')
      .subscribe(res => {
        console.log(res);
        this.cleanLocal();
        this.router.navigate(['./repartidor/pedidos']);
      });
  }

  // fin de pedido // guarda datos del pedido
  finalizarPedidoPropioRepartidor(): void {
    const _idPedidoRepartidor = this.pedidoRepartidor.datosRepartidor ? this.pedidoRepartidor.datosRepartidor.idrepartidor : this.infoTokenService.infoUsToken.usuario.idrepartidor;
    const _dataSend = {
      idrepartidor: _idPedidoRepartidor,
      idpedido: this.pedidoRepartidor.idpedido,
      idcliente: this.pedidoRepartidor.datosCliente.idcliente,
      idsede: this.pedidoRepartidor.datosComercio.idsede,
      operacion: {
        isrepartidor_propio: true,
        metodoPago: this.pedidoRepartidor.datosDelivery.metodoPago,
        importeTotalPedido: parseFloat(this.pedidoRepartidor.importePagaCliente),
        importePagadoRepartidor: this.pedidoRepartidor.importePedido, // (a)(b)
        comisionRepartidor: 0,
        propinaRepartidor: 0,
        costoTotalServicio: 0,
        importeDepositar: 0 // (a)
        // importePagaRepartidor: parseFloat(this.pedidoRepartidor.datosDelivery.importeTotal),
      }
    };

     // notifica cambios en el pedido, para colocar icono entregado en el mapa del repartidor
     this.pedidoRepartidor.estado = 4;
     this.pedidoRepartidor.paso_va = 4;
     this.pedidoRepartidor.pwa_delivery_status = 4;

    this.listenService.setPedidoModificado(this.pedidoRepartidor);

    // cuando termina el pedido el repartidor se guarda el tiempo en el pedido
    this.crudService.postFree(_dataSend, 'repartidor', 'set-fin-pedido-entregado')
      .subscribe(res => {
        console.log(res);

        console.log('repartidor-propio-notifica-fin-pedido');
        this.socketService.emit('repartidor-propio-notifica-fin-pedido', this.pedidoRepartidor);
        // this.cleanLocal();
        // this.router.navigate(['./repartidor/pedidos']);
      });
  }

  // // fin timer // busca otro repartidor
  pedidoNoAceptadoReasingar() {
    // estado = 1 es aceptado
    if ( this.pedidoRepartidor.estado === 0 ) {
      console.log('termina tiempo reasigna pedido repartidor-declina-pedido', this.pedidoRepartidor);
      const _num_reasignado = this.pedidoRepartidor.num_reasignado ? this.pedidoRepartidor.num_reasignado + 1 : 0;
      this.pedidoRepartidor.num_reasignado = _num_reasignado === 0 ? 1 : _num_reasignado;
      this.pedidoRepartidor.is_reasignado = true;
      // this.socketService.emit('repartidor-declina-pedido', this.pedidoRepartidor);

      // clear local pedido
      this.cleanLocal();
    }
  }


  darFormatoLocalPedidoRepartidorModel(_pedido) {
    let pedido: PedidoRepartidorModel = new PedidoRepartidorModel;

    if ( !_pedido ) { return; }
    if (  _pedido?.conFormato ) {
      pedido = _pedido;
    } else {
      pedido.idpedido = _pedido.idpedido;
          // pedido.datosItems = res[1].dataItems || res[1].datosItem;
          // pedido.datosDelivery = res[1].dataDelivery || res[1].datosDelivery;
      pedido.datosItems = _pedido.json_datos_delivery.p_body;
      pedido.datosDelivery = _pedido.json_datos_delivery.p_header.arrDatosDelivery;
      pedido.datosComercio = pedido.datosDelivery.establecimiento;
      pedido.datosCliente = pedido.datosDelivery.direccionEnvioSelected;
      pedido.datosSubtotales = pedido.datosDelivery.subTotales;
      pedido.datosSubtotalesShow = pedido.datosDelivery.subTotales;
      pedido.conFormato = true;
    }


    this.pedidoRepartidor = pedido;
    this.setLocal();
  }

}
