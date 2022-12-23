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
import { EstablecimientoService } from './establecimiento.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { CalcDistanciaService } from './calc-distancia.service';
import { TimeLinePedido } from 'src/app/modelos/time.line.pedido';
import { SendMsjService } from './send-msj.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoRepartidorService {
  pedidoRepartidor: PedidoRepartidorModel;
  pedidoSelected: any;
  grupoPedidoIds: any;
  grupoPedidoItems: any;
  keyLocal = 'sys::pr';
  keyLocalIds = 'sys::pr::ids';
  keyLocalItem = 'sys::pr::it';
  keyLocalItemSelected = 'sys::pr::selected';

  private _repartidor;

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    private infoTokenService: InfoTockenService,
    private listenService: ListenStatusService,
    private socketService: SocketService,
    private calcDistanciaService: CalcDistanciaService,
    private sendMsjService: SendMsjService
  ) {
    this.init();
  }

  init() {
    this.pedidoRepartidor = this.getLocal();

  }

  cleanLocal(): void {
    localStorage.removeItem(this.keyLocalIds);
    localStorage.removeItem(this.keyLocalItem);
    localStorage.removeItem(this.keyLocal);
    localStorage.removeItem(this.keyLocalItemSelected);
    localStorage.removeItem('sys::pXa');
    this.pedidoRepartidor = this.getLocal();
  }

  setPasoVa(val: number) {
    this.pedidoRepartidor.paso_va = val;
    this.setLocal(this.pedidoRepartidor);
  }

  setPedidoPasoVa(val: number) {
    // console.log('estado cambiado', val);
    this.pedidoRepartidor.pedido_paso_va = val;
    this.setLocal(this.pedidoRepartidor);
  }

  // setCostoSercicio(val: string) {
  //   this.pedidoRepartidor.c_servicio = val;
  //   this.setLocal(this.pedidoRepartidor);
  // }

  // setImporteTotalPedido(val: string) {
  //   this.pedidoRepartidor.importePedido = val;
  //   this.setLocal(this.pedidoRepartidor);
  // }

  // setIsHayPropina(val: boolean) {
  //   this.pedidoRepartidor.isHayPropina = val;
  //   this.setLocal(this.pedidoRepartidor);
  // }

  setLocal(obj = null) {
    obj = obj ? obj : this.pedidoRepartidor;
    localStorage.setItem(this.keyLocal, btoa(JSON.stringify(obj)));
  }

  setLocalIds(obj) {
    // obj = obj ? obj : this.pedidoRepartidor;
    localStorage.setItem(this.keyLocalIds, btoa(JSON.stringify(obj)));
  }

  setLocalItems(obj) {
    // obj = obj ? obj : this.pedidoRepartidor;
    localStorage.setItem(this.keyLocalItem, btoa(JSON.stringify(obj)));
  }

  setPedidoSelect(obj: any) {
    localStorage.setItem(this.keyLocalItemSelected, btoa(JSON.stringify(obj)));
  }

  setPedidoPorAceptar(obj: any) {
    localStorage.setItem('sys::pXa', btoa(JSON.stringify(obj)));
  }

  getPedidoPorAceptar() {
    const rpt = localStorage.getItem('sys::pXa');
    return rpt ? JSON.parse(atob(rpt)) : null;
  }

  getPedidoSelect() {
    const rpt = localStorage.getItem(this.keyLocalItemSelected);
    return rpt ? JSON.parse(atob(rpt)) : null;
  }

  getLocalIds(): any {
    const rpt = localStorage.getItem(this.keyLocalIds);
    return rpt ? JSON.parse(atob(rpt)) : null;
  }

  getLocalItems(): any {
    const rpt = localStorage.getItem(this.keyLocalItem);
    return rpt ? JSON.parse(atob(rpt)) : null;
  }

  getLocal(): PedidoRepartidorModel {
    const rpt = localStorage.getItem(this.keyLocal);
    return rpt ? JSON.parse(atob(rpt)) : new PedidoRepartidorModel;
    // try {
    // } catch (error) {
    //   console.log('clean pedido from getlocal');
    //   this.cleanLocal();
    //   return new PedidoRepartidorModel;

    // }
  }

  asignarPedido(): void {
    const ids = this.getLocalIds().pedidos.join(',');
    const _data = {
      idpedido: ids,
      repartidor: !this._repartidor ? this.infoTokenService.getInfoUs().usuario : this._repartidor
    };

    console.log('set-asignar-pedido', _data);

    this.crudService.postFree(_data, 'repartidor', 'set-asignar-pedido', true)
      .subscribe(res => {
        // console.log(res);
        this.pedidoRepartidor.estado = 1; // asignadp
        this.setLocal();
        // this.setPasoVa(1);

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
  darFormatoSubTotales(arrTotales: any = null, pwa_delivery_comercio_paga_entrega = null , costoEntrega = null) {
    this.init();
    arrTotales = arrTotales && arrTotales.length > 0 ? arrTotales : this.pedidoRepartidor.datosSubtotalesShow;
    const rowTotal = arrTotales[arrTotales.length - 1];

    // lo que paga el cliente
    this.pedidoRepartidor.importePagaCliente = rowTotal.importe;

    pwa_delivery_comercio_paga_entrega = pwa_delivery_comercio_paga_entrega !== null ? pwa_delivery_comercio_paga_entrega : this.pedidoRepartidor.datosComercio.pwa_delivery_comercio_paga_entrega;
    costoEntrega = costoEntrega ? costoEntrega : this.pedidoRepartidor.datosDelivery.costoTotalDelivery;

    // agregar o restar el importe del costo de entrega SI el comercio paga el costo de entrega pwa_delivery_comercio_paga_entrega
    if ( pwa_delivery_comercio_paga_entrega === 1 ) {
      // const costoEntrega = this.pedidoRepartidor.datosDelivery.costoTotalDelivery;
      // ingresamos en la penultima postion del arrTotales
      const postionInsert = arrTotales.length - 1;
      const _row = {
        descripcion: 'Costo de Entrega',
        esImpuesto: 0,
        id: -4,
        importe: - costoEntrega,
        quitar: false,
        tachado: false,
        visible: false,
        visible_cpe: false
      };
      arrTotales.splice(postionInsert, 0, _row);

      // console.log('costo de entrega insertado', arrTotales);
    }


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

  darFormatoPedidoLocal(pedidoLocal: PedidoModel, subotales = null): any {
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

    this.reCalcularSubTotal(subTotalDefault, subotales);
    return pedidoLocal;
  }

  // subTotal = recibido del default
  reCalcularSubTotal( subTotalDefault: number , subotales = null) {
    this.init();
    const _rowSubTotal = subotales ? subotales[0] : this.pedidoRepartidor.datosSubtotales[0];
    // si el tototal es igual quiere decir de que no hay default comercio afiliado
    if ( subTotalDefault === parseFloat(_rowSubTotal.importe) ) { return; }
    const _diffSubTotal  = parseFloat(_rowSubTotal.importe) - subTotalDefault;
    _rowSubTotal.importe = subTotalDefault;

    // sumamos los totales
    const rowTotal = subotales.filter(x => x.descripcion === 'TOTAL')[0];

    // importe que pagara el cliente
    this.pedidoRepartidor.importePagaCliente = rowTotal.importe;


    rowTotal.importe = parseFloat(rowTotal.importe) - _diffSubTotal;

    // this.pedidoRepartidor.datosSubtotales =
    // this.setLocal();
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

  // load pedidos asignados // grupo de pedidos
  loadPedidosRecibidos(_ids: string) {
    return new Observable(observer => {
      const _dataSend = {
        ids: _ids
      };
      this.crudService.postFree(_dataSend, 'repartidor', 'get-pedidos-recibidos-group')
        .subscribe(res => {
          // this.pedidoRepartidor.estado = res.data[0].pwa_delivery_status;
          observer.next(res.data);
        });
    });
  }


  // fin de pedido // guarda datos del pedido
  // isGrupoPedidos = si es grupo de pedidos
  // time_line_pedido guarda la hora de entrega
  finalizarPedido(isGrupoPedidos = false, time_line_pedido = null): void {
    const comisionRepartidor = parseFloat(this.pedidoRepartidor.datosDelivery.costoTotalDelivery); // - parseFloat( this.pedidoRepartidor.datosComercio.pwa_delivery_comision_fija_no_afiliado );
    const propinaRepartidor = this.pedidoRepartidor.datosDelivery.propina.value;
    const costotalServicio = comisionRepartidor + parseFloat(propinaRepartidor);

    const _importePagaCliente = this.pedidoRepartidor.importePagaCliente ? parseFloat(this.pedidoRepartidor.importePagaCliente) : parseFloat(this.pedidoRepartidor.importePedido) + costotalServicio;

    // importeDepositar siempre y cuando el comercio no esta afiliado
    // const importeDepositar = _importePagaCliente - (parseFloat(this.pedidoRepartidor.importePedido) + costotalServicio);
    const _idRepartidor = this.pedidoRepartidor.datosRepartidor ? this.pedidoRepartidor.datosRepartidor.idrepartidor : this.infoTokenService.infoUsToken.usuario.idrepartidor;
    const _dataSend = {
      idrepartidor: _idRepartidor,
      idpedido: this.pedidoRepartidor.idpedido,
      time_line: time_line_pedido ? time_line_pedido : 0,
      idcliente: this.pedidoRepartidor.datosDelivery.idcliente,
      idsede: this.pedidoRepartidor.datosComercio.idsede,
      operacion: {
        isrepartidor_propio: false,
        metodoPago: this.pedidoRepartidor.datosDelivery.metodoPago,
        importeTotalPedido: _importePagaCliente,
        importePagadoRepartidor: this.pedidoRepartidor.importePedido, // (a)(b)
        comisionRepartidor: comisionRepartidor - this.pedidoRepartidor.datosComercio.pwa_delivery_comision_fija_no_afiliado, // menos costo fijo comercio no afiliado,
        propinaRepartidor: propinaRepartidor,
        costoTotalServicio: costotalServicio,
        importeDepositar: parseFloat( this.pedidoRepartidor.datosComercio.pwa_delivery_comision_fija_no_afiliado ).toFixed(2) // (a)
        // importePagaRepartidor: parseFloat(this.pedidoRepartidor.datosDelivery.importeTotal),
      }
    };

    // (a) = cuando el comercio no esta afiliado el importe que el repartidor debe depositar, el imnporte fijo de comercio no afiliado
    // (b) = precios de los productos sin comision
    this.crudService.postFree(_dataSend, 'repartidor', 'set-fin-pedido-entregado')
      .subscribe(res => {
        // console.log(res);
        // console.log('clean from finalizarPedido');
        // chequea si todos los pedidos estan finalizados
        if ( isGrupoPedidos ) {
          const _pedidoFinalizar = this.getPedidoSelect();
          this.listenService.setPedidoModificado(_pedidoFinalizar);

          const allPedidos = this.getLocalItems();
          // save estado pedido
          const elPedido = allPedidos.filter(p => p.idpedido === _pedidoFinalizar.idpedido)[0];
          elPedido.estado = 2;
          this.setLocalItems(allPedidos);
          this.socketService.emit('repartidor-notifica-fin-one-pedido', _pedidoFinalizar);

          // console.log('repartidor-notifica-fin-one-pedido');

          // chequea si los demas estan ya estan cerrados
          const numCerrados = allPedidos.filter(p => p.estado === 0).length;

          // if ( numCerrados === 0 ) {
          //   this.socketService.emit('repartidor-grupo-pedido-finalizado', _idRepartidor);
          //   // console.log('repartidor-grupo-pedido-finalizado');
          //   this.cleanLocal();
          //   this.router.navigate(['./main/pedidos']);
          // }

        } else {

          this.socketService.emit('repartidor-propio-notifica-fin-pedido', this.pedidoRepartidor);

          this.cleanLocal();
          // this.router.navigate(['./main/pedidos']);
        }

      });
  }

  // fin de pedido // guarda datos del pedido
  finalizarPedidoPropioRepartidor(time_line_pedido = null): void {
    const _idPedidoRepartidor = this.pedidoRepartidor.datosRepartidor ? this.pedidoRepartidor.datosRepartidor.idrepartidor : this.infoTokenService.infoUsToken.usuario.idrepartidor;
    const _dataSend = {
      idrepartidor: _idPedidoRepartidor,
      idpedido: this.pedidoRepartidor.idpedido,
      time_line: time_line_pedido ? time_line_pedido : 0,
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
        // console.log(res);

        // console.log('repartidor-propio-notifica-fin-pedido');
        this.socketService.emit('repartidor-propio-notifica-fin-pedido', this.pedidoRepartidor);
        // this.cleanLocal();
        // this.router.navigate(['./repartidor/pedidos']);
      });
  }

  finalizarPedidoExpress(pedido: any, _listPedidos: any) {
    const _tipo_pedido = pedido.isretiroatm ? 'express' : 'retiro_atm';
    const _dataSend = {
      idpedido_mandado: pedido.idpedido_mandado,
      pedidos_quedan: _listPedidos,
      num_quedan: _listPedidos.pedidos.length,
      tipo_pedido: _tipo_pedido
    };

    this.crudService.postFree(_dataSend, 'repartidor', 'set-fin-pedido-express-entregado', true)
    .subscribe(res => console.log(res));
  }

  listaPedidosEntregados() {
    this._repartidor = this.infoTokenService.getInfoUs().usuario;
    this.socketService.emit('repartidor-grupo-pedido-finalizado', this._repartidor.idrepartidor);
    this.cleanLocal();
  }

  // // fin timer // busca otro repartidor
  pedidoNoAceptadoReasingar() {
    // estado = 1 es aceptado
    if ( this.pedidoRepartidor.estado === 0 ) {
      // console.log('termina tiempo reasigna pedido repartidor-declina-pedido', this.pedidoRepartidor);
      const _num_reasignado = this.pedidoRepartidor.num_reasignado ? this.pedidoRepartidor.num_reasignado + 1 : 0;
      this.pedidoRepartidor.num_reasignado = _num_reasignado === 0 ? 1 : _num_reasignado;
      this.pedidoRepartidor.is_reasignado = true;
      // this.socketService.emit('repartidor-declina-pedido', this.pedidoRepartidor);

      // clear local pedido
      // console.log('clean from pedidoNoAceptadoReasingar');
      this.cleanLocal();
    }
  }


  darFormatoLocalPedidoRepartidorModel(_pedido) {
    console.log('dar formato pedido');
    let pedido: PedidoRepartidorModel = new PedidoRepartidorModel;


    if ( !_pedido ) { return; }
    if (  _pedido?.conFormato ) {
      pedido = _pedido;
    } else {

      if ( !_pedido.datosItems ) {
        pedido.idpedido = _pedido.idpedido;
        const subTotalesPedid = _pedido.json_datos_delivery.p_header.arrDatosDelivery.subTotales.length > 0 ? _pedido.json_datos_delivery.p_header.arrDatosDelivery.subTotales : _pedido.json_datos_delivery.p_subtotales;
        // pedido.datosItems = res[1].dataItems || res[1].datosItem;
        pedido.datosDelivery = _pedido.json_datos_delivery; // res[1].dataDelivery || res[1].datosDelivery;
        pedido.datosItems = _pedido.json_datos_delivery.p_body;
        pedido.datosDelivery = _pedido.json_datos_delivery.p_header.arrDatosDelivery;
        pedido.datosComercio = pedido.datosDelivery.establecimiento;
        pedido.datosCliente = pedido.datosDelivery.direccionEnvioSelected;
        pedido.datosSubtotales = subTotalesPedid;
        pedido.datosSubtotalesShow = pedido.datosDelivery.subTotales.length === 0 ? subTotalesPedid : pedido.datosDelivery.subTotales.length;
        pedido.conFormato = true;
      } else {
        pedido = _pedido;
      }
    }


    // coordenadas del comercio si esta en string lo pasa a decimal
    pedido.datosComercio.latitude = typeof pedido.datosComercio.latitude ===  'string' ? parseFloat(pedido.datosComercio.latitude) : pedido.datosComercio.latitude;
    pedido.datosComercio.longitude = typeof pedido.datosComercio.longitude ===  'string' ? parseFloat(pedido.datosComercio.longitude) : pedido.datosComercio.longitude;

    this.pedidoRepartidor = pedido;
    // this.setLocal();
  }

  // asignacion por barcode o por idpedido
  confirmarAsignacionReadBarCode(idpedidoLector: number) {
    console.log('aaaaaaaaa');
    return new Observable(observer => {
      let orden: any;
      let response = {};
      const _reparitdor = this.infoTokenService.getInfoUs().usuario;
      const _dataSendPedido = {
        idpedido: idpedidoLector
      };
      // get pedido
      this.crudService.postFree(_dataSendPedido, 'comercio', 'get-pedido-by-id', true)
      .subscribe((res: any) => {

        orden  = res.data[0];
        response = this.addPedidoInListPedidosPendientes(orden);
        observer.next(response);
        // const _importePedido = parseFloat(orden.total_r);
        // let pedidos_repartidor = this.getPedidoPorAceptar();

        // orden.json_datos_delivery = JSON.parse(orden.json_datos_delivery);


        // if ( pedidos_repartidor ) {
        //   // buscar si el pedido ya fue agregado
        //   const isHayPedido = pedidos_repartidor.pedidos.filter(x => x.toString() === idpedidoLector.toString())[0];
        //   if ( isHayPedido ) {
        //     response = {
        //       elPedido: orden,
        //       pedidos_repartidor: pedidos_repartidor
        //     };
        //     observer.next(response);
        //     return;
        //   }

        //   pedidos_repartidor.pedidos.push(orden.idpedido);
        //   pedidos_repartidor.importe_acumula = parseFloat( pedidos_repartidor.importe_acumula ) + _importePedido;
        //   pedidos_repartidor.importe_pagar = parseFloat( pedidos_repartidor.importe_pagar ) + _importePedido;
        //   pedidos_repartidor.pedido_asignado_manual = orden.idpedido; // para reset a los demas repartidores
        //   pedidos_repartidor.idrepartidor = _reparitdor.idrepartidor;
        //   pedidos_repartidor.inSede = true; // no necesita coordenadas de la sede porque se supone que esta en la sede
        // } else {
        //   const _listPedido = [];
        //   _listPedido.push(orden.idpedido);

        //   pedidos_repartidor = {
        //     pedidos: _listPedido,
        //     importe_acumula: _importePedido.toFixed(2),
        //     importe_pagar: _importePedido.toFixed(2),
        //     idsede: orden.idsede,
        //     idrepartidor: _reparitdor.idrepartidor,
        //     pedido_asignado_manual: orden.idpedido,
        //     inSede: true
        //   };
        // }

        // // guardar pedido escaneado
        // this.setPedidoPorAceptar(pedidos_repartidor);

        // const _dataSend = {
        //   pedido : pedidos_repartidor
        // };

        // this.crudService.postFree(_dataSend, 'monitor', 'set-asignar-pedido-manual', true)
        // .subscribe( resp => {
        //   console.log(resp);
        //   // orden.nom_repartidor = _reparitdor.nombre;
        //   // orden.idrepartidor = _reparitdor.idrepartidor;
        //   // orden.telefono_repartidor = _reparitdor.telefono_repartidor;
        // });

        // // return orden;
        // response = {
        //   elPedido: orden,
        //   pedidos_repartidor: pedidos_repartidor
        // };
        // observer.next(response);

      });

    });

  }

  addPedidoInListPedidosPendientes(orden: any): any {
    let response = {};
    const _reparitdor = this.infoTokenService.getInfoUs().usuario;
    const idpedidoLector = orden.idpedido;

    const _importePedido = parseFloat(orden.total_r);
    let pedidos_repartidor = this.getPedidoPorAceptar();

    orden.json_datos_delivery = typeof orden.json_datos_delivery !== 'object' ? JSON.parse(orden.json_datos_delivery) : orden.json_datos_delivery;


    if ( pedidos_repartidor ) {
      // buscar si el pedido ya fue agregado
      const isHayPedido = pedidos_repartidor.pedidos.filter(x => x.toString() === idpedidoLector.toString())[0];
      if ( isHayPedido ) {
        response = {
          elPedido: orden,
          pedidos_repartidor: pedidos_repartidor
        };

        return response;
      }

      pedidos_repartidor.pedidos.push(orden.idpedido);
      pedidos_repartidor.importe_acumula = parseFloat( pedidos_repartidor.importe_acumula ) + _importePedido;
      pedidos_repartidor.importe_pagar = parseFloat( pedidos_repartidor.importe_pagar ) + _importePedido;
      pedidos_repartidor.pedido_asignado_manual = orden.idpedido; // para reset a los demas repartidores
      pedidos_repartidor.idrepartidor = _reparitdor.idrepartidor;
      pedidos_repartidor.inSede = true; // no necesita coordenadas de la sede porque se supone que esta en la sede
    } else {
      const _listPedido = [];
      _listPedido.push(orden.idpedido);

      pedidos_repartidor = {
        pedidos: _listPedido,
        importe_acumula: _importePedido.toFixed(2),
        importe_pagar: _importePedido.toFixed(2),
        idsede: orden.idsede,
        idrepartidor: _reparitdor.idrepartidor,
        pedido_asignado_manual: orden.idpedido,
        inSede: true
      };
    }

    // guardar pedido escaneado
    this.setPedidoPorAceptar(pedidos_repartidor);

    const _dataSend = {
      pedido : pedidos_repartidor,
      repartidor: this._repartidor
    };

    this.crudService.postFree(_dataSend, 'monitor', 'set-asignar-pedido-manual', true)
    .subscribe( resp => {
      console.log(resp);
      // orden.nom_repartidor = _reparitdor.nombre;
      // orden.idrepartidor = _reparitdor.idrepartidor;
      // orden.telefono_repartidor = _reparitdor.telefono_repartidor;
    });

    // return orden;
    response = {
      elPedido: orden,
      pedidos_repartidor: pedidos_repartidor
    };

    return response;
    // observer.next(response);
  }


  // chequea si ya llego al comercio
  checkLLegoComercio(listPedidos: [], geoPositionActual: GeoPositionModel) {
    let geoPositionComercio: GeoPositionModel = new GeoPositionModel();
    let _newTimeLinePedido = new TimeLinePedido()
    listPedidos.map((p: any) => {      
      const comercioPedido = p.json_datos_delivery.p_header.arrDatosDelivery.establecimiento;
      _newTimeLinePedido = p.time_line || _newTimeLinePedido      

      geoPositionComercio.latitude = typeof comercioPedido.latitude === 'string'  ? parseFloat(comercioPedido.latitude) : comercioPedido.latitude;
      geoPositionComercio.longitude = typeof comercioPedido.longitude === 'string'  ? parseFloat(comercioPedido.longitude) : comercioPedido.longitude;

      // const _distanciaMt = this.calcDistanciaService.calcDistanciaEnMetros(geoPositionActual, geoPositionComercio);

      // 100mtr a la redonda
      const isLLego = geoPositionComercio.latitude ? 
                      this.calcDistanciaService.calcDistancia(geoPositionComercio, geoPositionActual, 100)
                      : false

      // p.llego_comercio = isLLego;
      // p.distanciaMtr = _distanciaMt;      
      
      
      // _newTimeLinePedido.llego_al_comercio = !_newTimeLinePedido.llego_al_comercio ? isLLego : false;
      
      if ( isLLego ) { // envia mensaje
        // _newTimeLinePedido.mensaje_enviado.llego_al_comercio = true;
        _newTimeLinePedido.llego_al_comercio = true;
        _newTimeLinePedido.paso = 1;
        this.sendMsjService.msjClienteTimeLine(p, _newTimeLinePedido);
      } else {
        // si sale del comercio con el pedido camino al cliente
        if ( _newTimeLinePedido.paso === 1 ) {
          // _newTimeLinePedido.mensaje_enviado.en_camino_al_cliente = true;
          _newTimeLinePedido.en_camino_al_cliente = true;
          _newTimeLinePedido.paso = 2
          this.sendMsjService.msjClienteTimeLine(p, _newTimeLinePedido);
        }
      }      

      
    })
  }


}
