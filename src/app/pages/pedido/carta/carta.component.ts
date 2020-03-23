import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';

import { Subscription } from 'rxjs/internal/Subscription';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subject } from 'rxjs/internal/Subject';


@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css', '../pedido.style.css']
})
export class CartaComponent implements OnInit, OnDestroy, AfterViewInit {

  private unsubscribeCarta = new Subscription();
  // private destroyCarta$: Subject<boolean> = new Subject<boolean>();
  // objCartaCarta: any;
  objCartaBus: any = [];
  isBusqueda = false;
  private isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  // max_minute_order = MAX_MINUTE_ORDER;
  // time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];

  // objSelectedItem: ItemModel;
  // objSeccionSelected: SeccionModel = new SeccionModel();

  // listItemsPedido: ItemModel[] = [];
  // miPedido: PedidoModel = new PedidoModel();

  private tiposConsumo: TipoConsumoModel[] = [];
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];
  private itemSelected: ItemModel;
  private seccionSelected: SeccionModel;
  private countSeeBack = 2; // primera vista al dar goback

  private isFirstLoadListen = false; // si es la primera vez que se carga, para no volver a cargar los observables

  constructor(
      private socketService: SocketService,
      public miPedidoService: MipedidoService,
      private reglasCartaService: ReglascartaService,
      // private jsonPrintService: JsonPrintService,
      private navigatorService: NavigatorLinkService,
      private listenStatusService: ListenStatusService,
      private infoToken: InfoTockenService,
      private dialog: MatDialog,
      ) {

  }

  ngOnInit() {
    this.initCarta();
  }

  ngAfterViewInit() {
    // this.initCarta();
  }

  initCarta() {
    this.isCargado = true;
    this.socketService.connect();

    this.listeStatusBusqueda();

    this.unsubscribeCarta = this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      if (res.pageActive === 'carta') {
        if (this.countSeeBack < 2) { this.countSeeBack++; return; }
        this.goBack();
      } else {
        this.countSeeBack = 0;
      }
    });

    // console.log('aaa');
    // if (!this.socketService.isSocketOpen) {
      this.unsubscribeCarta = this.socketService.onGetCarta().subscribe((res: any) => {

        // this.objCartaCarta = {
        //   'carta': <CartaModel[]>res[0].carta,
        //   'bodega': <SeccionModel[]>res[0].bodega
        // };

        if (this.socketService.isSocketOpenReconect) {
          // actualizar cantidad actual (stock actual) de ObjCarta del item
          // if ( !this.miPedidoService.findIsHayItems() ) {
          //   this.miPedidoService.updatePedidoFromStrorage();
          // }

            // this.objCartaCarta = res;
            //
            this.miPedidoService.setObjCarta(res);

            this.resetParamsCarta();

            if ( this.miPedidoService.findIsHayItems() ) {
              this.miPedidoService.updatePedidoFromStrorage();
            }

            console.log('objCartaCarta desde socket reconect');
            this.navigatorService.setPageActive('carta');
          // }

          return;
        }
        // this.objCartaCarta = res;
        //
        this.miPedidoService.setObjCarta(res);

        this.resetParamsCarta();

        // this.isCargado = false;
        // // this.showCategoria = true;

        // this.objSecciones = [];
        // this.objItems = [];
        // this.showCategoria = false;
        // this.showSecciones = false;
        // this.showItems = false;
        // this.showCategoria = true;


        this.miPedidoService.clearPedidoIsLimitTime();
        this.miPedidoService.updatePedidoFromStrorage();

        // restaurar cuenta de timepo limite
        console.log('restore timer limt');
        this.miPedidoService.restoreTimerLimit();

        this.loadItemsBusqueda();

        if ( this.isFirstLoadListen ) {return; }
        this.isFirstLoadListen = true; // para que no vuelva a cargar los observables cuando actualizan desde sockets
        this.miPedidoService.listenChangeCantItem(); // cuando se reconecta para que actualize
      });

      // tipo de consumo
      this.unsubscribeCarta = this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel[]) => {
        console.log('tipo consumo ', res);
        if (this.socketService.isSocketOpenReconect) {return; }
        this.tiposConsumo = res;

        // set tipos de consumo a new item tipo cosnumo para los item vista
        this.tiposConsumo.map((t: TipoConsumoModel) => {
          const _objTpcAdd = new ItemTipoConsumoModel();
          _objTpcAdd.descripcion = t.descripcion;
          _objTpcAdd.idtipo_consumo = t.idtipo_consumo;
          _objTpcAdd.titulo = t.titulo;

          // filtramos los tipos de consumo segun qr escaneado o personal autorizado


          if ( this.infoToken.isCliente() ) {
            if ( !this.infoToken.isDelivery() ) {
              if ( t.descripcion === 'DELIVERY' ) { return; }
              if ( this.infoToken.isSoloLlevar() && t.descripcion.indexOf('LLEVAR') === -1 ) { return; }
            } else {
              if ( t.descripcion !== 'DELIVERY' ) { return; } else {_objTpcAdd.descripcion = 'CANTIDAD'; }
            }
          }

          // if ( this.infoToken.isCliente() && t.descripcion === 'DELIVERY' ) {

          // } else {
            this.objNewItemTiposConsumo.push(_objTpcAdd);
          // }
        });

        this.navigatorService.addLink('carta-i-');

        // console.log('this.objNewItemTiposConsumo', this.objNewItemTiposConsumo);
        // this.tiposConsumo.secciones = [];

        // this.loadItemsBusqueda();
      });
    // }

    // reglas de la carta y subtotales
    this.reglasCartaService.loadReglasCarta();

    // this.miPedidoService.listenChangeCantItem();

    // datos de la sede, impresoras
    // this.jsonPrintService.getDataSede();
  }


  // al obtener la carta
  private resetParamsCarta(): void {
    this.isCargado = false;
    this.objSecciones = [];
    this.objItems = [];
    this.showCategoria = false;
    this.showSecciones = false;
    this.showItems = false;
    this.showToolBar = false;
    this.showCategoria = true;
  }

  ngOnDestroy(): void {
    console.log('======= unsubscribe ======= ');
    this.unsubscribeCarta.unsubscribe();
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
  }

  getSecciones(categoria: CategoriaModel) {
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      // local storage categoria
      localStorage.setItem('sys::cat', categoria.idcategoria.toString());

      this.tituloToolBar = categoria.des;
      this.navigatorService.addLink('carta-i-secciones');
    }, 250);
  }

  getItems(seccion: SeccionModel) {
    this.miPedidoService.setObjSeccionSeleced(seccion);
    setTimeout(() => {
      this.seccionSelected = seccion;
      this.objItems = seccion.items;
      this.showSecciones = false;
      this.showItems = true;
      this.tituloToolBar += ' / ' + seccion.des;
      this.navigatorService.addLink('carta-i-secciones-items');
    }, 150);

  }

  private getItems_seccion_from_busqueda(_itemBus: any): any {
    const _seccionBus = {
      des: _itemBus.seccion,
      idseccion: _itemBus.idseccion,
      idimpresora: _itemBus.idimpresora,
      sec_orden: _itemBus.sec_orden,
      ver_stock_cero: _itemBus.ver_stock_cero,
    };

    this.miPedidoService.setObjSeccionSeleced(<SeccionModel>_seccionBus);
  }


  /// busqueda
  loadItemsBusqueda() {
    let _objFind: any;
    // _objFind = this.miPedidoService.getObjCartaLibery();
    _objFind = this.miPedidoService.getObjCarta();

    // extraemos
    let _itemFind: any;
    _objFind.carta.map((c: CategoriaModel) => {
      c.secciones.map((s: SeccionModel) => {
        s.items.map((i: ItemModel) => {
          _itemFind = i;
          _itemFind.seccion = s.des;
          _itemFind.idimpresora = s.idimpresora;
          _itemFind.sec_orden = s.sec_orden;
          _itemFind.ver_stock_cero = s.ver_stock_cero;
          _itemFind.selected = false;
          _itemFind.visible = true;
          this.objCartaBus.push(_itemFind);
        });
      });
    });

    // reset busqueda
    window.localStorage.setItem('sys::find', '');
    // tipo consumo
    console.log('_objFind', this.objCartaBus);
  }



  goBack() {
    this.objItems.map(x => x.selected = false);
    if (this.showItems) {
      this.showItems = false;
      this.showSecciones = true;
      this.tituloToolBar = this.tituloToolBar.split(' / ')[0];
      // this.navigatorService.addLink('carta-i-secciones');
      return;
    }
    if (this.showSecciones) {
      this.showSecciones = false; this.showToolBar = false; this.showCategoria = true;
      // this.navigatorService.addLink('carta-i-');
    }
  }

  selectedItem(_selectedItem: ItemModel) {
    // if (!this.isBusqueda) {
    //   this.objItems.map(x => x.selected = false);
    // } else {
    //   this.objCartaBus.map(x => x.selected = false);
    // }

    if ( _selectedItem.cantidad.toString() === '0' && !_selectedItem.cantidad_seleccionada ) { return; }

    _selectedItem.selected = true;
    this.itemSelected = _selectedItem;

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = _selectedItem.itemtiposconsumo ? _selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !_selectedItem.itemtiposconsumo ) {
      _selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    this.openDlgItem(_selectedItem);
  }

  // abrir el dialog item
  private openDlgItem(_item: ItemModel): void {
    const dialogConfig = new MatDialogConfig();
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);
    if ( !_itemFromCarta.itemtiposconsumo ) {
      _itemFromCarta.itemtiposconsumo = _item.itemtiposconsumo;
    }
    // const _seccionItemSelect = this.miPedidoService.findItemSeccionCarta(_itemFromCarta.idseccion);

    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: null,
      seccion: !this.isBusqueda ? this.seccionSelected : this.miPedidoService.findItemSeccionCarta(_itemFromCarta.idseccion),
      item: _itemFromCarta,
      objItemTipoConsumoSelected: this.itemSelected.itemtiposconsumo
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


  addItemToPedido(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, suma);
  }

  addItemToPedidoFromBusqueda(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    // setea la seccion del item
    this.getItems_seccion_from_busqueda(this.itemSelected);

    // agrega el item
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, suma);
  }

  addItemIndicaciones(itemCarta: ItemModel, _indicaciones: string): void {
    console.log('indicaciones', _indicaciones);
    this.itemSelected.indicaciones = _indicaciones;
    itemCarta.indicaciones = _indicaciones;

    // const _itemInMipedido = this.miPedidoService.findOnlyItemMiPedido(itemCarta);
    // if ( _itemInMipedido ) {
    //   _itemInMipedido.indicaciones = _indicaciones;
    // }
  }

  getEstadoStockItem(stock: any): string {
    if ( stock === 'ND' || isNaN(stock) ) {
      // stock = 'ND';
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

  private listeStatusBusqueda(): void {
    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
    });

    this.listenStatusService.charBuqueda$.subscribe((res: string) => {
      this.isBusquedaFindNow(res);
    });

    this.socketService.isSocketOpen$.subscribe(res => {
      if (!res) {
        console.log('===== unsubscribe unsubscribe Carta =====');
        this.unsubscribeCarta.unsubscribe();
      }
    });
  }

  private isBusquedaFindNow(charFind: string): void {
    charFind = charFind.toLowerCase();
    console.log(charFind);
    let _charConcat = '';
    this.objCartaBus.map((i: any) => {
      _charConcat = `${i.des} ${i.seccion} ${i.detalles}`;
      _charConcat = _charConcat.toLowerCase();
      i.visible = _charConcat.indexOf(charFind) > -1 ? true : false;
    });
  }

  getObjDetalleSeccion(seccion: SeccionModel): String {
    let resp = '';
    seccion.items.map((i: ItemModel, index: number) => {
      if (index > 5) {return; }
      resp += i.des.toLowerCase() + ', ';
    });

    return resp.slice(0, -2);
  }

  // addSubItem(subitem: SubItem): void {
  //   // subitem.selected = !subitem.selected;

  //   // if ( subitem.selected ) {
  //     // const listSubItemChecked = this.itemSelected.subitems.filter((x: SubItem) => x.selected);
  //     // let countSelectReq = listSubItemChecked.length;

  //     // // adicional el importe al precio del item
  //     // this.itemSelected.precio = this.itemSelected.precio_unitario + subitem.precio;
  //     // // this.itemSelected.precio_total = parseFloat(this.itemSelected.precio);


  //     // listSubItemChecked.map( (_subItem: SubItem, i: number) =>  {
  //     //   if (countSelectReq > this.itemSelected.subitem_cant_select && _subItem !== subitem) {
  //     //     _subItem.selected = false;
  //     //     countSelectReq--;
  //     //   }
  //     // });


  //   // }
  // }



}
