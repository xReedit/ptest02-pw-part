import { Component, OnInit, OnDestroy } from '@angular/core';

import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { JsonPrintService } from 'src/app/shared/services/json-print.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { RegistrarPagoService } from 'src/app/shared/services/registrar-pago.service';


import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { FormValidRptModel } from 'src/app/modelos/from.valid.rpt.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SubItemsView } from 'src/app/modelos/subitems.view.model';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { DialogLoadingComponent } from './dialog-loading/dialog-loading.component';
import { DialogResetComponent } from './dialog-reset/dialog-reset.component';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil, take, last, takeLast } from 'rxjs/operators';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-resumen-pedido',
  templateUrl: './resumen-pedido.component.html',
  styleUrls: ['./resumen-pedido.component.css']
})
export class ResumenPedidoComponent implements OnInit, OnDestroy {

  // private unsubscribeRe = new Subscription();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  _miPedido: PedidoModel = new PedidoModel();
  _arrSubtotales: any = [];
  hayItems = false;
  isVisibleConfirmar = false;
  isVisibleConfirmarAnimated = false;
  isHayCuentaBusqueda: boolean;
  numMesaCuenta = '';
  rulesCarta: any;
  rulesSubtoTales: any;

  msjErr = false;

  isReserva = false;
  isRequiereMesa = false;
  isDelivery = false;
  isDeliveryValid = false;
  frmConfirma: any = {};
  frmDelivery: any = {};

  arrReqFrm: FormValidRptModel;

  rippleColor = 'rgb(255,238,88, 0.5)';
  rippleColorSubItem = 'rgba(117,117,117,0.1)';

  objCuenta: any = [];

  isCliente: boolean; // si es cliente quien hace el pedido
  isSoloLLevar: boolean; // si es solo llevar
  isDeliveryCliente: boolean; // si es cliente delivery
  isReadyClienteDelivery = false; // si el formulario(confirmacion) clienteDelivery esta listo

  private isFirstLoadListen = false; // si es la primera vez que se carga, para no volver a cargar los observables

  private isBtnPagoShow = false; // si el boton de pago ha sido visible entonces recarga la pagina de pago

  constructor(
    private miPedidoService: MipedidoService,
    private reglasCartaService: ReglascartaService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private jsonPrintService: JsonPrintService,
    private infoToken: InfoTockenService,
    private crudService: CrudHttpService,
    private listenStatusService: ListenStatusService,
    private estadoPedidoClientService: EstadoPedidoClienteService,
    private dialog: MatDialog,
    private router: Router,
    private registrarPagoService: RegistrarPagoService,
    ) { }

  ngOnInit() {

    this._miPedido = this.miPedidoService.getMiPedido();

    this.reglasCartaService.loadReglasCarta()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
      this.rulesCarta = res[0] ? res[0].reglas ? res[0].reglas : [] : res.reglas ? res.reglas : [];
      this.rulesSubtoTales = res.subtotales || res[0].subtotales;

      this.listenMiPedido();

      this.newFomrConfirma();


      // this.frmDelivery = new DatosDeliveryModel();
    });

    this.navigatorService.resNavigatorSourceObserve$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
          if (res.pageActive === 'mipedido') {
            if (res.url.indexOf('confirma') > 0) {
              this.confirmarPeiddo();
            } else {
              this.backConfirmacion();
            }
          }
        });

    this.listenStatusService.isBtnPagoShow$
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: boolean) => {
          this.isBtnPagoShow = res;
          if (!res) {
            const localBtnP = localStorage.getItem('sys::btnP');
            if ( localBtnP && localBtnP.toString() === '1' ) {
              this.isBtnPagoShow = true;
             }
          }
        });


    // si es cliente
    this.isCliente = this.infoToken.isCliente();
    this.isSoloLLevar = this.infoToken.isSoloLlevar();
    this.isDeliveryCliente = this.infoToken.isDelivery();
    this.isClienteSetValues();
  }

  // si es cliente asigna mesa
  private isClienteSetValues(): void {
    if ( this.isCliente ) {
      this.isRequiereMesa = false;
    }
  }

  ngOnDestroy(): void {
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
    // this.unsubscribeRe.unsubscribe();
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private newFomrConfirma(): void {
    this.frmConfirma = {
      mesa: '',
      referencia: '',
      reserva: false,
      solo_llevar: false,
      delivery: false
    };
  }

  pintarMiPedido() {
    // if (!this.isHayCuentaBusqueda) {
      this.miPedidoService.validarReglasCarta(this.rulesCarta);
    // }

    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));
    this.hayItems = this._arrSubtotales[0].importe > 0 ? true : false;

  }

  listenMiPedido() {
    if ( this.isFirstLoadListen ) {return; }
    this.isFirstLoadListen = true; // para que no vuelva a cargar los observables cuando actualizan desde sockets


    this.miPedidoService.countItemsObserve$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      this.hayItems = res > 0 ? true : false;
    });

    // .pipe(last())
    this.miPedidoService.miPedidoObserver$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res) => {
      // this.miPedidoService.clearObjMiPedido(); // quita las cantidades 0
      // this._miPedido = this.miPedidoService.getMiPedido();
      this._miPedido = <PedidoModel>res;
      this.pintarMiPedido();
      console.log(this._miPedido);
    });

    this.listenStatusService.hayCuentaBusqueda$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      this.isHayCuentaBusqueda = res;
    });

    // cuando es solo llevar // estar pendiente de pago suscces para enviar el pedido
    this.listenStatusService.isPagoSucces$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      // toma la respuesta de pago
      // const resPago = JSON.parse(localStorage.getItem('sys::transaction-response'));
      // const resPagoIsSucces = resPago ? !resPago.error : false;
      const resPago = this.registrarPagoService.getDataTrasaction();
      if (resPago.isSuccess && this.isSoloLLevar) {
        // localStorage.removeItem('sys::transaction-response');
        this.registrarPagoService.removeLocalDataTransaction();
        this.enviarPedido();
      }
    });

    this.socketService.isSocketOpen$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      if (!res) {
        console.log('===== unsubscribe unsubscribe =====');
        // this.unsubscribeRe.unsubscribe();
      }
    });


    // si es cliente escucha cunado termina de hacer el pedido
    if ( this.isCliente ) {
      this.socketService.onGetNuevoPedido()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        // this.estadoPedidoClientService.getCuentaTotales();
        // this.xLoadCuentaMesa('', this.estadoPedidoClientService.getCuenta());
        // this.estadoPedidoClientService.setImporte(this._arrSubtotales[this._arrSubtotales.length - 1].importe);
      });
    }

    // escucha que haya cuenta del cliente
    this.estadoPedidoClientService.hayCuentaCliente$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      if ( res ) {
        console.log('cuenta del cliente desde resumen', res);
        this.xLoadCuentaMesa('', res);
      }
    });


    // escucha isOutEstablecimientoDelivery
    this.listenStatusService.isOutEstablecimientoDelivery$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      if ( res ) {
        this.goBackOutEstablecimiento();
        this.listenStatusService.setIsOutEstablecimientoDelivery(false);
      }
    });
  }

  addItemToResumen(_tpc: ItemTipoConsumoModel, _seccion: SeccionModel, _item: ItemModel, _subItems: SubItemsView, suma: number): void {

    this.miPedidoService.setObjSeccionSeleced(_seccion);
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);

    // obtenemos el tipo consumo de carta
    const _tpc_item_carta = _itemFromCarta.itemtiposconsumo.filter((x: ItemTipoConsumoModel) => x.idtipo_consumo === _tpc.idtipo_consumo)[0];

    // this.miPedidoService.setobjItemTipoConsumoSelected( _itemInList.itemtiposconsumo);
    _itemFromCarta.subitems_selected = _subItems.subitems;
    _itemFromCarta.cantidad_seleccionada = _item.cantidad_seleccionada;

    this.miPedidoService.addItem2(_tpc_item_carta, _itemFromCarta, suma);

  }

  openDlgItemToResumen(_seccion: SeccionModel, _item: ItemModel): void {
    const dialogConfig = new MatDialogConfig();
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);

    dialogConfig.panelClass = 'dialog-item-edit';
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: null,
      seccion: _seccion,
      item: _itemFromCarta,
      objItemTipoConsumoSelected: _itemFromCarta.itemtiposconsumo
    };

    const dialogRef = this.dialog.open(DialogItemEditComponent, dialogConfig);

    // subscribe al cierre y obtiene los datos
    dialogRef.afterClosed().subscribe(
        data => {
          if ( !data ) { return; }
          console.log('data dialog', data);
        }
    );

  }

  nuevoPedido() {
    this.backConfirmacion();
    if (this.isVisibleConfirmar) {
      this.backConfirmacion();
      // this.isVisibleConfirmarAnimated = false;
      // setTimeout(() => {
      //   this.isVisibleConfirmar = false;
      // }, 300);
      return;
    }

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    const dialogReset = this.dialog.open(DialogResetComponent, _dialogConfig);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        this.miPedidoService.resetAllNewPedido();
        this.navigatorService.setPageActive('carta');
      }
    });

    this.newFomrConfirma();
  }

  nuevoPedidoFromCuenta(): void {
    this.navigatorService.setPageActive('carta');
  }

  private backConfirmacion(): void {
    this.navigatorService.addLink('mipedido');
    this.isVisibleConfirmarAnimated = false;
    this.isRequiereMesa = false;
    setTimeout(() => {
      this.isVisibleConfirmar = false;
    }, 300);
  }

  private confirmarPeiddo(): void {

    if (this.isVisibleConfirmarAnimated ) { // enviar pedido
      if (this.isRequiereMesa || !this.isDeliveryValid ) {

        // si el pago del delivery es en efectivo procesa pago
        if ( this.infoToken.infoUsToken.metodoPago.idtipo_pago === 1 ) {
          this.prepararEnvio();
        }
        return;
      }

      this.prepararEnvio();
    } else {

      this.isVisibleConfirmar = true;
      this.isVisibleConfirmarAnimated = true;

      this.checkTiposDeConsumo();
      this.checkIsRequierMesa();
      this.checkIsDelivery();

      this.navigatorService.addLink('mipedido-confirma');

      this.isClienteSetValues();
    }
  }

  private prepararEnvio(): void {
    if ( !this.isDeliveryCliente ) {
      this.showLoaderPedido();
      // const _dialogConfig = new MatDialogConfig();
      // _dialogConfig.disableClose = true;
      // _dialogConfig.hasBackdrop = true;

      // const dialogLoading = this.dialog.open(DialogLoadingComponent, _dialogConfig);
      // dialogLoading.afterClosed().subscribe(result => {
      //   this.enviarPedido();
      // });
    } else {
      // si es delivery y paga en efectivo
      if ( this.infoToken.infoUsToken.metodoPago.idtipo_pago === 1 ) {
        this.showLoaderPedido();
      } else {
        this.enviarPedido();
      }
    }

  }

  private showLoaderPedido(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    const dialogLoading = this.dialog.open(DialogLoadingComponent, _dialogConfig);
    dialogLoading.afterClosed().subscribe(result => {
      this.enviarPedido();
    });
  }

  private enviarPedido(): void {

    // usuario o cliente
    const dataUsuario = this.infoToken.getInfoUs();

    const dataFrmConfirma: any = {};
    if ( this.isCliente ) {
      this.frmConfirma.solo_llevar = this.isSoloLLevar ? true : this.frmConfirma.solo_llevar;
      dataFrmConfirma.m = this.isSoloLLevar ? '' : dataUsuario.numMesaLector;
      dataFrmConfirma.r = this.infoToken.getInfoUs().nombres.toUpperCase();
      dataFrmConfirma.nom_us = this.infoToken.getInfoUs().nombres.toLowerCase();
    } else {
      dataFrmConfirma.m = this.frmConfirma.mesa ? this.frmConfirma.mesa.toString().padStart(2, '0') || '00' : '00';
      dataFrmConfirma.r = this.frmConfirma.referencia || '';
      dataFrmConfirma.nom_us = this.infoToken.getInfoUs().nombres.split(' ')[0].toLowerCase();
    }


    // header //

    const _p_header = {
      m: dataFrmConfirma.m, // this.frmConfirma.mesa ? this.frmConfirma.mesa.toString().padStart(2, '0') || '00' : '00',
      r: dataFrmConfirma.r, // this.frmConfirma.referencia || '',
      nom_us: dataFrmConfirma.nom_us, // this.infoToken.getInfoUs().nombres.split(' ')[0].toLowerCase(),
      delivery: this.frmConfirma.delivery || this.isDeliveryCliente ? 1 : 0,
      reservar: this.frmConfirma.reserva ? 1 : 0,
      solo_llevar: this.frmConfirma.solo_llevar ? 1 : 0,
      idcategoria: localStorage.getItem('sys::cat'),
      correlativo_dia: '', // en backend
      num_pedido: '', // en backend
      isCliente: this.isCliente ? 1 : 0,
      isSoloLLevar: this.isSoloLLevar,
      idregistro_pago: 0,
      // idregistro_pago: this.isSoloLLevar ? this.registrarPagoService.getDataTrasaction().idregistro_pago : 0,
      arrDatosDelivery: this.frmDelivery
    };

    const dataPedido = {
      p_header: _p_header,
      p_body: this._miPedido,
      p_subtotales: this._arrSubtotales
    };

    console.log('nuevoPedido', dataPedido);
    console.log('nuevoPedido', JSON.stringify(dataPedido));


    // enviar a print_server_detalle // para imprimir
    const arrPrint = this.jsonPrintService.enviarMiPedido();
    const dataPrint: any = [];
    arrPrint.map((x: any) => {
      dataPrint.push({
        Array_enca: _p_header,
        ArraySubTotales: this._arrSubtotales,
        ArrayItem: x.arrBodyPrint,
        Array_print: x.arrPrinters
      });
    });

    const dataSend = {
      dataPedido: dataPedido,
      dataPrint: dataPrint,
      dataUsuario: dataUsuario
    };

    // console.log('printerComanda', dataSend);
    console.log('printerComanda', JSON.stringify(dataSend));
    // this.socketService.emit('printerComanda', dataPrint);

    // si es clienteDelivery no se emite nada
    // primero confirma el pago y luego guarda pedido y posteriormente el pago
    // guardamos el pedido

    if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago === 2) {
      this.infoToken.setOrderDelivery(JSON.stringify(dataSend), JSON.stringify(this._arrSubtotales));
      this.pagarCuentaDeliveryCliente();
      // enviamos a pagar
      return;
    }




    // enviar a guardar // guarda pedido e imprime comanda
    this.socketService.emit('nuevoPedido', dataSend);


    // hora del pedido
    this.estadoPedidoClientService.setHoraInitPedido(new Date().getTime());

    //
    // this.navigatorService.addLink('mipedido');
    // this.isVisibleConfirmarAnimated = false;
    // this.isRequiereMesa = false;
    // this.isVisibleConfirmar = false;
    //
    this.newFomrConfirma();
    this.backConfirmacion();

    this.miPedidoService.prepareNewPedido();

    // si es delivery y el pago es en efectivo, notificamos
    if ( this.isDeliveryCliente && dataUsuario.metodoPago.idtipo_pago === 1) {
      this.pagarCuentaDeliveryCliente();
      // enviamos a pagar
      return;
    }

    // si es usuario cliente lo envia a estado
    if ( this.isCliente ) {
      this.navigatorService.setPageActive('estado');
      // this.estadoPedidoClientService.get(); // inicia calc tiempo aprox y cuenta total
    } else {
      this.navigatorService.setPageActive('carta');
    }

  }

  private checkTiposDeConsumo(): void {
    this.arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;
    this.frmConfirma.solo_llevar = this.arrReqFrm.isTpcSoloDelivery ? false : this.arrReqFrm.isTpcSoloLLevar;
    this.frmConfirma.delivery = this.arrReqFrm.isTpcSoloDelivery;
  }

  checkIsRequierMesa(): void {
    // const arrReqFrm = <FormValidRptModel>this.miPedidoService.findEvaluateTPCMiPedido();
    // const isTPCLocal = arrReqFrm.isTpcLocal;
    // this.isRequiereMesa = arrReqFrm.isRequiereMesa;
    const numMesasSede = parseInt(this.miPedidoService.objDatosSede.datossede[0].mesas, 0);

    let isMesaValid = this.frmConfirma.mesa ? this.frmConfirma.mesa !== '' ? true : false : false;
    // valida la mesa que no sea mayor a las que hay
    const numMesaIngresado = isMesaValid ? parseInt(this.frmConfirma.mesa, 0) : 0;
    isMesaValid = numMesaIngresado === 0 || numMesaIngresado > numMesasSede ? false : true;
    this.isRequiereMesa = this.arrReqFrm.isRequiereMesa;

    // this.isRequiereMesa = isTPCLocal;
    this.isRequiereMesa = this.isRequiereMesa && (!isMesaValid && !this.frmConfirma.reserva);

  }

  private checkIsDelivery() {
    this.isDelivery = this.miPedidoService.findMiPedidoIsTPCDelivery();
    // this.frmConfirma.delivery = this.isDelivery;
  }

  checkDataDelivery($event: any) {
    this.isDeliveryValid = $event.formIsValid;
    this.frmDelivery = $event.formData;
  }

  // _resCuentaFromCliente desde la cuenta del cliente
  xLoadCuentaMesa(mesa: string, _resCuentaFromCliente: any = null): void {
    this.isHayCuentaBusqueda = false;
    this.msjErr = false;
    this.numMesaCuenta = mesa;
    const datos = { mesa: mesa };
    // console.log('mesa a buscar', datos);

    if ( _resCuentaFromCliente ) {
      // cuando el usuario cliente realiza un nuevo pedido y se tiene que mostrar la cuenta
      this.desglozarCuenta(_resCuentaFromCliente);
      setTimeout(() => {
        this.estadoPedidoClientService.setImporte(this._arrSubtotales[this._arrSubtotales.length - 1].importe);
      }, 1000);
      return;
    }

    this.crudService.postFree(datos, 'pedido', 'lacuenta').subscribe((res: any) => {
      this.desglozarCuenta(res);
    });
  }


  private desglozarCuenta(res: any): void {
    const _miPedidoCuenta: PedidoModel = new PedidoModel();
    const c_tiposConsumo: TipoConsumoModel[] = [];

    // si se encontro cuenta
    if (res.data.length === 0) {
      this.isHayCuentaBusqueda = false;
      this.msjErr = true;
      this.listenStatusService.setHayCuentaBuesqueda(false);
      return; }

    this.isHayCuentaBusqueda = true;
    this.listenStatusService.setHayCuentaBuesqueda(true);
    // tipo consumo
    res.data.map( (tp: any) => {
      let hayTpc = c_tiposConsumo.filter(x => x.idtipo_consumo === tp.idtipo_consumo)[0];
      if (!hayTpc) {
        hayTpc = new TipoConsumoModel;
        hayTpc.descripcion = tp.des_tp;
        hayTpc.idtipo_consumo = parseInt(tp.idtipo_consumo, 0);
        c_tiposConsumo.push(hayTpc);
      }
    });

    // secciones


    // const _listSec = res.data.reduce(function(rv, x) {
    //     (rv[x['idseccion']] = rv[x['idseccion']] || []).push(x);
    //     return rv;
    //   }, {});


    c_tiposConsumo.map((tp: TipoConsumoModel) => {
      res.data
        .filter((_tp: any) => _tp.idtipo_consumo === tp.idtipo_consumo)
        .map((_s: any, i: number) => {
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
          hayItem.subitems_view = _i.subitems === 'null' || _i.subitems === '' || !_i.subitems ? [] : JSON.parse(_i.subitems);
          s.count_items = i + 1;
          s.items.push(hayItem);
        });
      });
    });

    console.log('cuenta de mesa', res);
    console.log('c_tiposConsumo', c_tiposConsumo);

    _miPedidoCuenta.tipoconsumo = c_tiposConsumo;
    this.miPedidoService.setObjMiPedido(_miPedidoCuenta);
    this._miPedido = this.miPedidoService.getMiPedido();

    // para notificar antes del pago
    this._arrSubtotales = this.miPedidoService.getArrSubTotales(this.rulesSubtoTales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._arrSubtotales)));

    console.log('this._miPedido', this._miPedido);
  }

  pagarCuentaDeliveryCliente() {
    // this.navigatorService._router('./pagar-cuenta');
    // if ( !localStorage.getItem('sys::st') ) {
    //   this.verCuenta();
    //   return;
    // }

    // this.estadoPedidoClientService.getCuenta(); // get subtotales - esta listen resumen-pedido;
    this.router.navigate(['./pagar-cuenta'])
    .then(() => {
      if ( this.isBtnPagoShow ) {
        window.location.reload();
      }
    });
    // .then(() => {
    //   if ( this.isBtnPagoShow ) {
    //     window.location.reload();
    //   }
    // });

    // this.listenStatusService.setIsPagePagarCuentaShow(true);
  }


  private goBackOutEstablecimiento() {
    const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {idMjs: 2};

        const dialogReset = this.dialog.open(DialogResetComponent, dialogConfig);
        dialogReset.afterClosed().subscribe(result => {
          if (result ) {
            this.miPedidoService.resetAllNewPedido();
            this.miPedidoService.cerrarSession();
            // this.socketService.closeConnection();
            // this.navigatorService.cerrarSession();
            this.infoToken.cerrarSession();
          }
        });

  }

}
