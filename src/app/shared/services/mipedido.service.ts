import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';


import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
// import { MAX_MINUTE_ORDER } from '../config/config.const';

// servicios
import { StorageService } from './storage.service';
import { SocketService } from './socket.service';
import { TimerLimitService } from './timer-limit.service';
import { NavigatorLinkService } from './navigator-link.service';
import { UtilitariosService } from './utilitarios.service';
import { ListenStatusService } from './listen-status.service';


import { MatSnackBar } from '@angular/material/snack-bar';
import { FormValidRptModel } from 'src/app/modelos/from.valid.rpt.model';
import { SubItem } from 'src/app/modelos/subitems.model';
import { SubItemsView } from 'src/app/modelos/subitems.view.model';
import { SubItemContent } from 'src/app/modelos/subitem.content.model';
import { CartaModel } from 'src/app/modelos/carta.model';
import { EstablecimientoService } from './establecimiento.service';
// import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
// import { takeUntil } from 'rxjs/internal/operators/takeUntil';


@Injectable({
  providedIn: 'root'
})
export class MipedidoService {

  private miPedidoSource = new BehaviorSubject<PedidoModel>(new PedidoModel());
  public miPedidoObserver$ = this.miPedidoSource.asObservable();

  // la carta observable
  // private laCartaObjSource = new BehaviorSubject<any>({});
  // public laCartaObj$ = this.laCartaObjSource.asObservable();

  // number tab Mi Pedido
  private countItemsSource = new BehaviorSubject<number>(0);
  public countItemsObserve$ = this.countItemsSource.asObservable();

  // observable que se modifco cantidad - stock de algun producto
  // si es que esta en resumen de pedido dialog -- actualize stock
  private itemStockChangeSource = new BehaviorSubject<ItemModel>(new ItemModel());
  public itemStockChangeObserve$ = this.itemStockChangeSource.asObservable();

  public objCarta: any;
  public objDatosSede: any;

  private isPreAvisoVisible = false;

  listItemsPedido: ItemModel[] = [];
  miPedido: PedidoModel = new PedidoModel();

  mpObjItemTipoConsumoSelected: ItemTipoConsumoModel[];
  mpObjSeccionSelected: SeccionModel = new SeccionModel();

  time = new Date();
  max_minute_order: number;


  constructor(
    private storageService: StorageService,
    private socketService: SocketService,
    private timerLimitService: TimerLimitService,
    private navigatorService: NavigatorLinkService,
    private _snackBar: MatSnackBar,
    private utilesService: UtilitariosService,
    private listenStatusService: ListenStatusService,
    private establecimientoService: EstablecimientoService, // datos del estableciento // clienteSelivery
    ) {

    }

  getObjCarta() {
    return this.objCarta;
  }

  getObjCartaLibery() {
    return JSON.parse(JSON.stringify(this.objCarta));
  }

  // cuando obtenemos la cuenta
  setObjMiPedido(obj: any): void {
    this.miPedido = obj;
    this.miPedidoSource.next(this.miPedido);
  }

  resetObjMiPedido(): void {
    this.miPedido = new PedidoModel();
    this.miPedidoSource.next(this.miPedido);
  }

  setObjCarta(res: any) {

    // esto lo manda desde carta component
    this.objCarta = {};

    // setTimeout(() => {
      this.objCarta = {
        'carta': null,
        'bodega': null
      };

      this.objCarta.carta = <CartaModel[]>res[0].carta;
      this.objCarta.bodega = <SeccionModel[]>res[0].bodega;

      // colocamos la bodega en todas las cartas
      const _carta = this.objCarta.carta;
      const _bodega = this.objCarta.bodega;
      if ( _bodega ) {
        _carta.map((c: CategoriaModel) => {
          _bodega.map((bs: SeccionModel) => {
            c.secciones.push(bs);
          });
        });
      }

      // this.laCartaObjSource.next(this.objCarta);
      console.log('objCartaCarta', this.objCarta);
    // }, 1000);
  }

  getMiPedido(): PedidoModel {
    if ( this.miPedido.tipoconsumo.length === 0 ) {
      if (this.storageService.isExistKey('sys::order::all')) {
        this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));
      }
    }
    // this.miPedidoSource.next(this.miPedido);
    return this.miPedido;
  }

  // setea los tipos de consumo del item seleccionado para sumar las cantidaddes seleccionadas
  setobjItemTipoConsumoSelected(_objItemTipoConsumoSelected: ItemTipoConsumoModel[]) {
    // this.mpObjItemTipoConsumoSelected = JSON.parse(JSON.stringify(_objItemTipoConsumoSelected));
    this.mpObjItemTipoConsumoSelected = _objItemTipoConsumoSelected;
  }

  // seteamos seccion seleccionada menos items[]; para que no se forme el bucle
  setObjSeccionSeleced(seccion: SeccionModel) {
    this.mpObjSeccionSelected = new SeccionModel();
    this.mpObjSeccionSelected.des = seccion.des;
    this.mpObjSeccionSelected.idimpresora = seccion.idimpresora;
    this.mpObjSeccionSelected.idseccion = seccion.idseccion;
    this.mpObjSeccionSelected.sec_orden = seccion.sec_orden;
    this.mpObjSeccionSelected.ver_stock_cero = seccion.ver_stock_cero;
  }

  // suma cantidad seleccionada
  // idTpcItemResumenSelect tipo consumo del item al modificar desde resumen, si el tpc es diferente al seleccionado en el dialog entonces no suma al item
  addItem2(tipoconsumo: ItemTipoConsumoModel, item: ItemModel, signo: number = 0, idTpcItemResumenSelect: number = null) {
    // let sumTotalTpcSelected = this.totalItemTpcSelected();

    // el item que viene es de carta o del resumen
    // buscamos el item en la carta para el stock
    // de esta manera manejamos una sola cantidad
    // idTpcItemResumenSelect si viene del resumen dialog
    // let cantItem = idTpcItemResumenSelect ? parseInt(this.findItemCarta(item).cantidad.toString(), 0) : parseInt(item.cantidad.toString(), 0);

    let cantItem = parseInt(item.cantidad.toString(), 0);
    const sumar = signo === 0 ? true : false;

    if (cantItem <= 0 && sumar) { return; }

    let cantSeleccionada = tipoconsumo.cantidad_seleccionada || 0;
    cantSeleccionada += sumar ? 1 : -1;
    if (cantSeleccionada < 0) { return; }

    if ( item.isporcion !== 'ND' ) {
      cantItem += sumar ? -1 : 1;
      cantSeleccionada = cantSeleccionada < 0 ? 0 : cantSeleccionada;
      cantItem = cantItem < 0 || cantSeleccionada < 0 ? 0 : cantItem;
    }

    cantSeleccionada = cantSeleccionada < 0 ? 0 : cantSeleccionada;
    tipoconsumo.cantidad_seleccionada = cantSeleccionada;

    // listItemsPedido -> para el local storage recuperar y resetear
    // const itemInList = this.findItemListPedido(item); // <ItemModel>this.listItemsPedido.filter( x => x.iditem === item.iditem )[0];
    // let sumTotalTpcSelected = 1;
    // if (itemInList) {
    //   sumTotalTpcSelected = this.totalItemTpcSelected(itemInList.itemtiposconsumo) || 0;
    //   itemInList.cantidad_seleccionada = sumTotalTpcSelected;

    // } else {
    //   this.listItemsPedido.push(item);
    // }

    // item
    // sumTotalTpcSelected = this.totalItemTpcSelected(itemInList.itemtiposconsumo) || 0;
    // actualizar cantidades en item carta
    // item.cantidad_seleccionada = sumTotalTpcSelected;
    // item.cantidad = cantItem;


    // json pedido
    const _tipoconsumo = JSON.parse(JSON.stringify(tipoconsumo));
    const itemInPedido = this.findItemMiPedido(_tipoconsumo, this.mpObjSeccionSelected, item, sumar);
    itemInPedido.cantidad = cantItem;

    // actualizar cantidades en item carta
    item = idTpcItemResumenSelect ? this.findItemCarta(item) : item;
    item = this.findItemCarta(item);

    // emitir item modificado
    item.sumar = sumar;
    item.subitems_selected = itemInPedido.subitems_selected;
    item.subitems_view = itemInPedido.subitems_view;

    // listItemsPedido -> para el local storage recuperar y resetear
    const itemInList = this.findItemListPedido(item); // <ItemModel>this.listItemsPedido.filter( x => x.iditem === item.iditem )[0];
    let sumTotalTpcSelected = 1;
    if (itemInList) {

      // por momentos pierde referencia al tipo de consumo, para evitar eso
      if (!itemInList.itemtiposconsumo) {
        itemInList.itemtiposconsumo = this.mpObjItemTipoConsumoSelected;
      }

      sumTotalTpcSelected = this.totalItemTpcSelected(itemInList.itemtiposconsumo) || 0;
      itemInList.cantidad_seleccionada = sumTotalTpcSelected;
      itemInList.subitems_selected = itemInPedido.subitems_selected;
      itemInList.subitems_view = itemInPedido.subitems_view;
    } else {
      this.listItemsPedido.push(item);
    }

    item.cantidad_seleccionada = sumTotalTpcSelected;
    // if (item.isporcion !== 'ND') { item.cantidad = cantItem; } // la cantidad lo envia el socket

    // comunica el cambio de stock en el item carta
    this.itemStockChangeSource.next(item);

    // hora que comienza a realizar el pedido
    this.setLocalStorageHora();

    // guardamos el pedido en local // por si se actualiza
    this.setLocalStoragePedido();

    // emitir item modificado
    // item.sumar = sumar;
    // item.subitems_selected = itemInPedido.subitems_selected;
    // item.subitems_view = itemInPedido.subitems_view;

    this.socketService.emit('itemModificado', item);

    console.log('listItemsPedido', this.listItemsPedido);
    console.log('itemModificado en add', item);
    console.log('itemModificado en add', JSON.stringify(item));

    this.listenStatusService.setHayPedidoPendiente(true);

    // item.subitems_selected = null;
    // itemInPedido.subitems_selected = null;
    // item.subitems_view = null;

    this.playTimerLimit();
  }

  totalItemTpcSelected(_arrTpc: any): number {
    return _arrTpc.map((x: ItemTipoConsumoModel) => x.cantidad_seleccionada || 0).reduce((a, b) => a + b, 0);
  }

  // cantidad seleccionada y precio
  addCantItemMiPedido(elItem: ItemModel, cantidad_seleccionada: number) {
    const cantSeleccionadaTPC = cantidad_seleccionada;
    const precioTotal = cantSeleccionadaTPC * parseFloat(elItem.precio_unitario);

    // total subitems
    // sumar el total
    const totalSubItems = elItem.subitems_selected ? elItem.subitems_selected.map((subIt: SubItem) => subIt.precio * subIt.cantidad_seleccionada).reduce((a, b) => a + b , 0) : 0;
    // const totalSubItems = elItem.subitems_view ? elItem.subitems_view.map((subIt: SubItemsView) => subIt.precio).reduce((a, b) => a + b , 0) : 0;
    // precioTotal += totalSubItems;

    elItem.cantidad_seleccionada = cantSeleccionadaTPC;
    // elItem.precio_total = precioTotal + totalSubItems;
    // elItem.precio_print = precioTotal + totalSubItems;

    elItem.precio_total = precioTotal;
    elItem.precio_print = precioTotal;
    // elItem.precio_total_calc = precioTotal;
  }

  // agrega el precio sumado con los subitems si los hay del item mipedido
  private addPrecioItemMiPedido(elItem: ItemModel): void {
    const totalSubItems = elItem.subitems_view ? elItem.subitems_view.map((subIt: SubItemsView) => subIt.precio).reduce((a, b) => a + b , 0) : 0;
    let precioTotal = elItem.cantidad_seleccionada * parseFloat(elItem.precio_unitario);
    precioTotal += totalSubItems;
    elItem.precio_total = precioTotal;
    elItem.precio_print = precioTotal;
  }

  // agrega a subitem_selected -> lista de subitems seleccionados
  private addItemSubItemMiPedido(elItem: ItemModel, itemCarta: ItemModel, sumar: boolean): void {
    if (elItem.subitems) {
      // elItem.subitems_view = elItem.subitems_view ? elItem.subitems_view : [];

      // subitemsviews
      if (elItem.subitems.length === 0 ) { return; }
      const newSubItemView: SubItemsView = new SubItemsView();
      newSubItemView.id = '';
      newSubItemView.des = '';
      newSubItemView.listDes = [];
      newSubItemView.cantidad_seleccionada = 0;
      newSubItemView.precio = 0;
      newSubItemView.indicaciones = '';
      newSubItemView.subitems = [];

      if ( elItem.subitems_selected && elItem.subitems_selected.length > 0 ) {

        elItem.subitems_selected.map((x) => {
          newSubItemView.id += x.iditem_subitem.toString();
          newSubItemView.listDes.push(this.utilesService.primeraConMayusculas(x.des.toLowerCase()));
          newSubItemView.cantidad_seleccionada = 1;
          newSubItemView.precio += parseFloat(x.precio.toString());
          // newSubItemView.indicaciones += x.indicaciones === undefined ? '' :  ' (' + x.indicaciones + ')';
          newSubItemView.subitems.push(x);
        });

        newSubItemView.des = newSubItemView.listDes.join(', ');

        newSubItemView.des += elItem.indicaciones === undefined || elItem.indicaciones === '' ? '' :  ', (' + elItem.indicaciones + ')';

        elItem.indicaciones = '';
        elItem.subitems_view = elItem.subitems_view ? elItem.subitems_view : [];

        const isExistSubItemView = elItem.subitems_view.filter((subView: SubItemsView) => subView.id === newSubItemView.id)[0];
        if ( isExistSubItemView ) {
          if ( sumar ) {
            isExistSubItemView.indicaciones += newSubItemView.indicaciones;
            isExistSubItemView.cantidad_seleccionada += 1;
            isExistSubItemView.precio += newSubItemView.precio;
          } else {
            // resta
            this.restarCantSubItemView(elItem, isExistSubItemView);
          }
        } else {
          // si no existe
          // isExistSubItemView.indicaciones = newSubItemView.indicaciones;
          if ( sumar ) {
            elItem.subitems_view.push(newSubItemView);
          } else {
            // si es restar y no existe en la lista quita el ultimo
            this.restarCantSubItemView(elItem, null);
          }
        }

        this.addPrecioItemMiPedido(elItem);

      }

      // let _subItemExist: SubItem;
      // elItem.subitems.filter((x: SubItem) => x.selected).map((subItem: SubItem) => {
      //   elItem.subitems_selected = elItem.subitems_selected ? elItem.subitems_selected : [];
      //   _subItemExist = elItem.subitems_selected.filter((subIt: SubItem) => subIt === subItem)[0];
      //   if ( _subItemExist ) {
      //     _subItemExist.cantidad_seleccionada++;
      //     _subItemExist.indicaciones = elItem.indicaciones || '';
      //     // _subItemExist.precio += subItem.precio;
      //   } else {
      //     subItem.indicaciones = elItem.indicaciones || '';
      //     subItem.cantidad_seleccionada = 1;
      //     elItem.subitems_selected.push(subItem);
      //   }
      // });

      // // subitemsviews
      // if (elItem.subitems.length === 0 ) { return; }
      // const newSubItemView: SubItemsView = new SubItemsView();
      // newSubItemView.id = 0;
      // newSubItemView.des = '';
      // newSubItemView.cantidad_seleccionada = 0;
      // newSubItemView.precio = 0;
      // newSubItemView.indicaciones = '';
      // newSubItemView.subitems = [];


      // if ( elItem.subitems_selected ) {

      //   elItem.subitems_selected.map((x: SubItem) => {
      //     newSubItemView.id += x.iditem_subitem;
      //     newSubItemView.des += x.des + ' ';
      //     newSubItemView.cantidad_seleccionada = 1;
      //     newSubItemView.precio += x.precio;
      //     newSubItemView.indicaciones += x.indicaciones === '' ? '' :  x.indicaciones  + '. ';
      //     newSubItemView.subitems.push(x);
      //   });

      //   // itemCarta para sacar los indicadores
      //   itemCarta.indicaciones = '';
      //   elItem.indicaciones = '';
      //   elItem.subitems_view = elItem.subitems_view ? elItem.subitems_view : [];

      //   const isExistSubItemView = elItem.subitems_view.filter((subView: SubItemsView) => subView.id === newSubItemView.id)[0];
      //   if ( isExistSubItemView ) {
      //     if ( sumar ) {
      //       isExistSubItemView.indicaciones += newSubItemView.indicaciones;
      //       isExistSubItemView.cantidad_seleccionada += 1;
      //       isExistSubItemView.precio += newSubItemView.precio;
      //     } else {
      //       // resta
      //       this.restarCantSubItemView(elItem, isExistSubItemView);

      //     }
      //   } else {
      //     // isExistSubItemView.indicaciones = newSubItemView.indicaciones;
      //     if ( sumar ) {
      //       elItem.subitems_view.push(newSubItemView);
      //     } else {
      //       // si es restar y no existe en la lista quita el ultimo
      //       this.restarCantSubItemView(elItem, null);
      //     }
      //   }

      // } else {

      //   this.restarCantSubItemView(elItem, null);
      // }

      // sumar importe total con los subitems
      // this.addPrecioItemMiPedido(elItem);

    }
  }

  restarCantSubItemView(_elItem: ItemModel, isExistSubItemView: SubItemsView = null): void {
    if ( isExistSubItemView ) {
      // si existe subitemview
      const precioDescontar = isExistSubItemView.precio / isExistSubItemView.cantidad_seleccionada;
      isExistSubItemView.cantidad_seleccionada -= 1;
      isExistSubItemView.precio -= precioDescontar;
      isExistSubItemView.precio = isExistSubItemView.precio < 0 ? 0 : isExistSubItemView.precio;

      if ( isExistSubItemView.cantidad_seleccionada <= 0 ) {
        // borrar el item
        _elItem.subitems_view = _elItem.subitems_view.filter((subView: SubItemsView) => subView.cantidad_seleccionada > 0);
      }

    } else {
      // si no envia o no existe el subitemview a restar toma el ultimo
      const lentSubItemView = _elItem.subitems_view.length;
      const _SubItemView = _elItem.subitems_view[lentSubItemView - 1];
      const precioDescontar = _SubItemView.precio / _SubItemView.cantidad_seleccionada;

      _SubItemView.cantidad_seleccionada --;
      _SubItemView.precio -= precioDescontar;

      if ( _SubItemView.cantidad_seleccionada <= 0 ) {
        // borrar el item
        _elItem.subitems_view = _elItem.subitems_view.filter((subView: SubItemsView) => subView.cantidad_seleccionada > 0);
      }

      // para restar en el back end
      _elItem.subitems_selected = _SubItemView.subitems;
    }
  }

  // del socket nuevo item from monitoreo stock
  addItemInCarta(newItem: any) {
    const newItemFind = this.findItemCarta(newItem);
    if ( newItemFind ) { // update
      console.log('update');
      newItemFind.cantidad = newItemFind.cantidad;
    } else { // agrega a la carta
      console.log('add in carta');
      this.objCarta.carta.map((cat: CategoriaModel) => {
        cat.secciones
          .filter((sec: SeccionModel) => sec.idseccion === newItem.idseccion )
          .map((sec: SeccionModel) => {
            sec.items.push(newItem);
        });
      });
    }

    // this.laCartaObjSource.next(this.objCarta.carta);
    console.log('item new add in carta', this.objCarta.carta);
  }

  // actualizar las cantidades despues de connectar
  // setUpdateCantAfterReconnect( arrObj: any ) {
  //   arrObj.carta.map((cat: CategoriaModel) => {
  //     cat.secciones.map((sec: SeccionModel) => {
  //       sec.items.filter((x: ItemModel) => x.indicaciones )
  //             .map((i: ItemModel) => {
  //               const itemCartaUpdate = this.findItemCarta(i);
  //               itemCartaUpdate.cantidad = i.cantidad;
  //             });
  //     });
  //   });
  // }

  // <---------- Busquedas ------> //

  // buscar item en listItemsPedido
  findItemFromArr(arrFind: any, item: ItemModel) {
    return arrFind.filter((x: any) => x.iditem === item.iditem)[0];
  }

  // buscar item en listItemsPedido
  findItemListPedido(item: ItemModel) {
    return this.listItemsPedido.filter((x: any) => x.iditem === item.iditem)[0];
  }

  // buscar item en carta y limpiar las indicaciones y subitems_seleceted
  // en nuevo pedido
  findItemCartaAndClearIndicaciones() {
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        sec.items.filter((x: ItemModel) => x.indicaciones )
              .map((x: ItemModel) => x.indicaciones = '');

        sec.items.filter((x: ItemModel) => x.subitems_selected )
              .map((x: ItemModel) => x.subitems_selected = null);

        sec.items.filter((x: ItemModel) => x.subitems_view )
              .map((x: ItemModel) => x.subitems_view = null);
      });
    });

    // this.laCartaObjSource.next(this.objCarta);
  }

  // buscar item en la carta
  findItemCarta(item: ItemModel): ItemModel {
    let rpt: ItemModel;
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        const _rpt = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
        if (_rpt) {
          rpt = _rpt;
          return rpt;
        }
      });
    });

    return rpt;
  }

  // buscar item en la carta x idItem
  findItemCartaByIdCartaLista(id: number): ItemModel {
    let rpt: ItemModel;
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        const _rpt = sec.items.filter((x: ItemModel) => x.idcarta_lista.toString() === id.toString())[0];
        if (_rpt) {
          rpt = _rpt;
          return rpt;
        }
      });
    });

    return rpt;
  }

  // buscar subitem del item segun idproducto + idporcion
  // iditemFilter = iditem que se va a filtrar, porque ya fue actualizado
  findSubItemCartaById(idFind: string, iditemFilter: string): SubItem[] {
    const rptSubItem: SubItem[] = [];
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        sec.items
        .filter((item: ItemModel) => item.iditem.toString() !== iditemFilter)
        .filter((item: ItemModel) => item.subitems)
        .map((item: ItemModel) => {
          item.subitems.map((subItemContent: SubItemContent) => {
            const _subItem = subItemContent.opciones.filter((x: SubItem) => x.idproducto.toString() + x.idporcion.toString() === idFind)[0];
            if (_subItem) {
              rptSubItem.push(_subItem);
              // console.log(item);
              // return rptSubItem;
            }
          });
        });
      });
    });
    return rptSubItem;
  }

  // resetear las cantidades seleccionadas en el item carta, luego de hacer un pedido para que no se quede marcado
  private resetCantidadesTpcItemCarta(): void {
    if ( !this.objCarta ) {return; }
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        sec.items.map( x => {
          x.indicaciones = '';
          x.cantidad_seleccionada = 0;
          x.itemtiposconsumo = null;
          // return x;
        });
      });
    });
  }

  findItemSeccionCarta(idFind: number): SeccionModel {
    let rpt: SeccionModel;
    this.objCarta.carta.map((cat: CategoriaModel) => {
      const _rpt = cat.secciones.filter((sec: SeccionModel) => sec.idseccion === idFind)[0];
      if ( _rpt ) {
        rpt = _rpt;
        return;
      }
    });
    return rpt;
  }

  // bucar item en Mi pedido, update indicaciones
  findOnlyItemMiPedido(itemSearch: ItemModel): ItemModel {
    let rpt: ItemModel;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((sec: SeccionModel) => {
          rpt = sec.items.filter((i: ItemModel) => i.idcarta_lista === itemSearch.idcarta_lista)[0];
        });
      });
    return rpt;
  }

  // buscar o agregar item en miPedido
  findItemMiPedido(_tpc: any, _seccion: SeccionModel, item: ItemModel, sumar: boolean): ItemModel {
    let rpt: ItemModel;
    // let elItem = item;
    // this.addItemSubItemMiPedido(item);

    let elItem = <ItemModel>JSON.parse(JSON.stringify(item));
    const cantSeleccionadaTPC = _tpc.cantidad_seleccionada;
    elItem.itemtiposconsumo = [];

    // elItem.indicaciones = item.indicaciones;

    this.addCantItemMiPedido(elItem, cantSeleccionadaTPC);

    const findTpc = <TipoConsumoModel>this.miPedido.tipoconsumo.filter((x: TipoConsumoModel) => x.idtipo_consumo === _tpc.idtipo_consumo)[0];
    if (findTpc) {
      // if (!sumar) { this.quitarTpcMiPedido(findTpc); return; }
      const findSecc = <SeccionModel>findTpc.secciones.filter((sec: SeccionModel) => sec.idseccion === _seccion.idseccion)[0];
      if (findSecc) {
        // if (!sumar) { this.quitarTpcMiPedido(findTpc); }
        const _rpt = findSecc.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
        if (_rpt) {

          // indicaciones
          _rpt.indicaciones = elItem.indicaciones;

          // actualiza subitems_selected
          // _rpt.subitems_selected = [];
          // _rpt.subitems_selected = elItem.subitems_selected;
          // _rpt.subitems_view = elItem.subitems_view;
          // this.addItemSubItemMiPedido(_rpt);

          this.addCantItemMiPedido(_rpt, cantSeleccionadaTPC);

          elItem = _rpt;

          // this.addItemSubItemMiPedido(elItem);
          // elItem.cantidad_seleccionada = this.addCantItemMiPedido(elItem.cantidad_seleccionada, sumar);
          rpt = elItem;
        } else {
          // si no existe item lo agrega
          // elItem.cantidad_seleccionada = 0;

          findSecc.items.push(elItem);
          rpt = elItem;
        }

        elItem.subitems = item.subitems;
        elItem.subitems_selected = item.subitems_selected;
        this.addItemSubItemMiPedido(elItem, item, sumar);
        this.setCountCantItemTpcAndSeccion(findTpc, findSecc);
      } else {
        // si no existe seccion add
        rpt = elItem;
        // _seccion.items.push(rpt);

        const _newSeccion = <SeccionModel>JSON.parse(JSON.stringify(_seccion));
        _newSeccion.items = [];
        _newSeccion.items.push(elItem);
        findTpc.secciones = findTpc.secciones ? findTpc.secciones : [];
        findTpc.secciones.push(_newSeccion);
        // findTpc.secciones.push(_seccion);

        this.addItemSubItemMiPedido(elItem, item, sumar);
        this.setCountCantItemTpcAndSeccion(findTpc, _newSeccion);
      }
    } else {
      // si no existe tpc add
      // elItem.cantidad_seleccionada = 0;
      elItem.subitems = item.subitems;
      elItem.subitems_selected = item.subitems_selected;
      this.addItemSubItemMiPedido(elItem, item, sumar);
      const _newSeccion = <SeccionModel>JSON.parse(JSON.stringify(_seccion));
      _newSeccion.items = [];
      _newSeccion.items.push(elItem);
      _tpc.secciones = _tpc.secciones ? _tpc.secciones : [];
      _tpc.secciones.push(_newSeccion);

      this.miPedido.tipoconsumo.push(_tpc);

      this.setCountCantItemTpcAndSeccion(_tpc, _newSeccion);
      rpt = elItem;
    }

    this.clearObjMiPedido();
    // this.miPedidoSource.next(this.miPedido);
    return rpt;
  }

  private quitarTpcMiPedido(tpcFind: TipoConsumoModel): void {
    if ( tpcFind.count_items_seccion === 1 ) {
      this.miPedido.tipoconsumo = this.miPedido.tipoconsumo.filter((tpc: TipoConsumoModel) => !tpcFind);
    }
  }

  private quitarSeccionMiPedido(secFind: SeccionModel): void {
    if ( secFind.count_items === 1 ) {
      this.miPedido.tipoconsumo.map((tpc: TipoConsumoModel) => {
        tpc.secciones.filter((sec: SeccionModel) => !secFind);
      });
    }
  }

  // busca si en el pedido hay para consumir en el local y si es asi, exigir numero de mesa
  findMiPedidoIsTPCLocal(): boolean {
    let rpt = false;
    this.miPedido.tipoconsumo
      .filter(x => x.titulo === 'LOCAL')
      .map((t: TipoConsumoModel) => {
        rpt = t.secciones.filter((s: SeccionModel) => s.count_items > 0)[0] ? true : false;
      });
    return rpt;
  }

  // busca si en el pedido hay para consumir en el local y si es asi, exigir numero de mesa
  findMiPedidoIsTPCDelivery(): boolean {
    let rpt = false;
    this.miPedido.tipoconsumo
      .filter(x => x.descripcion.toUpperCase() === 'DELIVERY')
      .map((t: TipoConsumoModel) => {
        rpt = t.secciones.filter((s: SeccionModel) => s.count_items > 0)[0] ? true : false;
      });
    return rpt;
  }

  // busca si en el pedido hay para consumir en el local y si es asi, exigir numero de mesa
  findMiPedidoIsTPCLLevar(): boolean {
    let rpt = false;
    this.miPedido.tipoconsumo
      .filter(x => x.descripcion.toUpperCase().indexOf('LLEVAR'))
      .map((t: TipoConsumoModel) => {
        rpt = t.secciones.filter((s: SeccionModel) => s.count_items > 0)[0] ? true : false;
      });
    return rpt;
  }

  // recorre los tipos de consumo y devuelve un arr de requerimientos
  findEvaluateTPCMiPedido(): any {
    const rptArr: FormValidRptModel = new FormValidRptModel();

    let sumTpcReqMesa = 0;

    this.miPedido.tipoconsumo
    .filter((t: TipoConsumoModel) => t.count_items_seccion > 0)
    .map((t: TipoConsumoModel) => {
      if (t.titulo === 'LOCAL') { rptArr.isTpcLocal = true; sumTpcReqMesa++; }
      if (t.descripcion.toUpperCase().indexOf('LLEVAR') > -1) { rptArr.isTpcSoloLLevar = true; sumTpcReqMesa++; }
      if (t.descripcion.toUpperCase().indexOf('DELIVERY') > -1) { rptArr.isTpcSoloDelivery = true; }

      rptArr.isRequiereMesa = rptArr.isTpcLocal ? true : false;
      rptArr.isTpcSoloLLevar = sumTpcReqMesa === 1 && rptArr.isTpcSoloLLevar ? true : false;
    });

    return rptArr;
  }

  // busca la seccion por idimpresora -- para mandar imprimir
  findSeccionInMipedidoByPrint(idPrintSearch: number): SeccionModel[] {
    let secRpt: SeccionModel[];
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        secRpt = tpc.secciones.filter((s: SeccionModel) => s.idimpresora === idPrintSearch);
      });
    return secRpt;
  }

  findIsHayItems(): boolean {
    return this.setCountTotalImtesPedido() > 0 ? true : false;
  }

  // quita los items, secciones, tpc con cantidad 0
  clearObjMiPedido(): void {
    // limpia los tipos de consumo con items = 0
    this.miPedido.tipoconsumo = this.miPedido.tipoconsumo.filter((tpc: TipoConsumoModel) => tpc.count_items_seccion > 0 );
    if ( this.miPedido.tipoconsumo.length === 0 ) {
      this.miPedido = new PedidoModel();

      console.log('mi pedido clear', this.miPedido);
      this.miPedidoSource.next(this.miPedido);
      return;
    }


    // limpia las secciones con items = 0
    this.miPedido.tipoconsumo = this.miPedido.tipoconsumo.map((tpc: TipoConsumoModel) => {
      tpc.secciones = tpc.secciones.filter((sec: SeccionModel) => sec.count_items > 0);
      return tpc;
    });

    // limpia las item con cantidad_seleccionada = 0
    this.miPedido.tipoconsumo = this.miPedido.tipoconsumo.map((tpc: TipoConsumoModel) => {
      tpc.secciones = tpc.secciones.map((sec: SeccionModel) => {
        sec.items = sec.items.filter((item: ItemModel) => item.cantidad_seleccionada > 0);
        return sec;
      });
      return tpc;
    });

    console.log('mi pedido clear', this.miPedido);
    this.miPedidoSource.next(this.miPedido);

  }

  // <---------- Busquedas ------> //


  // cuenta la cantidad de items en seccion
  setCountCantItemTpcAndSeccion(_tpc: TipoConsumoModel, _seccion: SeccionModel) {
    const countItemsSeccion = _seccion.items.map((i: ItemModel) => i.cantidad_seleccionada).reduce((a, b) => a + b, 0);
    _seccion.count_items = countItemsSeccion;

    const countSeccionTpc = _tpc.secciones.map((s: SeccionModel) => s.count_items).reduce((a, b) => a + b, 0);
    _tpc.count_items_seccion = countSeccionTpc;

    this.setCountTotalImtesPedido();
  }

  // <------ storage ---- > ///
  setCountTotalImtesPedido(): number {
    const countTotal = this.miPedido.tipoconsumo.map((t: TipoConsumoModel) => t.count_items_seccion).reduce((a, b) => a + b, 0);
    this.countItemsSource.next(countTotal);
    return countTotal;
  }

  setLocalStorageHora() {
    if (this.storageService.isExistKey('sys::h')) { return; }
    const hora = `${this.time.getHours()}:${this.time.getMinutes()}:${this.time.getSeconds()}`;
    this.storageService.set('sys::h', hora.toString());
  }

  setLocalStoragePedido() {
    this.storageService.set('sys::order', btoa(JSON.stringify(this.listItemsPedido)));
    this.storageService.set('sys::order::all', btoa(JSON.stringify(this.miPedido)));
  }

  clearPedidoIsLimitTime() {
    if (!this.storageService.isExistKey('sys::order')) { return; }
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(atob(this.storageService.get('sys::order')));
    this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));

    // if (this.isTimeLimit()) {
    //   // si el tiempo limite fue superado mandamos a restablecer carta
    //   // nuevo pdido
    //   this.socketService.emit('resetPedido', this.listItemsPedido);
    //   this.updatePedidoFromClear();
    //   // this.resetAllNewPedido();
    // }
  }

  // resetear stock
  resetAllNewPedido() {
    this.socketService.emit('resetPedido', this.listItemsPedido);
    // this.updatePedidoFromClear();
    this.prepareNewPedido();
  }

  // nuevo pedido // sin recuperar stock // cuando el envio fue exitoso
  prepareNewPedido(): void {
    // this.updatePedidoFromClear();
    this.resetTpcCarta();
    // this.findItemCartaAndClearIndicaciones();

    // valor en blanco para nuevo pedido
    this.storageService.clear('sys::h');
    this.storageService.clear('sys::order');
    this.storageService.clear('sys::order::all');
    this.storageService.clear('sys::tcount'); // timer count
    this.storageService.clear('sys::tnum'); // timer count
    // this.listItemsPedido = [];
    this.miPedido = null;
    this.miPedido = new PedidoModel();
    this.miPedidoSource.next(this.miPedido);
    this.countItemsSource.next(0);

    this.listenStatusService.setHayPedidoPendiente(false);

    this.stopTimerLimit();
    // this.getOnlyCarta();

    // this.
    // console.log('antes new', this.listItemsPedido);
  }

  // pide la carta nuevamente / despues de mandar el pedido o despues de reconectar
  private getOnlyCarta(): void {
    this.socketService.emit('getOnlyCarta', null);
  }

  // reset cantidades en vista tipos de consumo
  private resetTpcCarta(): void {
    try {
      this.listItemsPedido.map((item: ItemModel) => {
        item.indicaciones = '';
        if ( !item.itemtiposconsumo ) { return; }
        item.itemtiposconsumo = null;
        // item.itemtiposconsumo.map((tpc: ItemTipoConsumoModel) => {
        //   tpc.cantidad_seleccionada = 0;
        // });

        const _item = this.findItemCarta(item);
        _item.indicaciones = '';
        _item.cantidad_seleccionada = 0;
        _item.itemtiposconsumo = null;
        // _item.itemtiposconsumo.map((tpc: ItemTipoConsumoModel) => {
        //   tpc.cantidad_seleccionada = 0;
        // });
      });
    } catch (error) {
      console.log(error);
    }

    this.resetCantidadesTpcItemCarta();

    // this.laCartaObjSource.next(this.objCarta);

    this.listItemsPedido = [];
  }

  updatePedidoFromStrorage() {

    this.listenStatusService.setHayPedidoPendiente(false);

    if (!this.storageService.isExistKey('sys::order')) { return; }

    this.listenStatusService.setHayPedidoPendiente(true);
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(atob(this.storageService.get('sys::order')));
    this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));

    this.setCountTotalImtesPedido();
    this.miPedidoSource.next(this.miPedido);

    // actualizar // buscar cada item en el obj carta
    this.listItemsPedido.map((item: ItemModel) => {
      if (item.isalmacen === 0) {
        this.objCarta.carta.map((cat: CategoriaModel) => {
          cat.secciones.map((sec: SeccionModel) => {
            const itemUpdate = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
            if (itemUpdate) {
              // itemUpdate.cantidad = item.cantidad;
              itemUpdate.cantidad_seleccionada = item.cantidad_seleccionada;
              itemUpdate.itemtiposconsumo = item.itemtiposconsumo;
            }
          });
        });
      }
    });

    // this.laCartaObjSource.next(this.objCarta);
  }

  // actualiza la carta del pedido reseteado por tiempo limite
  // solo local porque a los demas se le emite el socket
  // el socket notifica a todos incluyendo al remitente lo que hace esta funcion obsoleta
  updatePedidoFromClear() {
    // actualizar // buscar cada item en el obj carta
    if ( !this.listItemsPedido ) {return; }
    this.listItemsPedido.map((item: ItemModel) => {
      if (item.isalmacen === 0) {
        this.objCarta.carta.map((cat: CategoriaModel) => {
          cat.secciones.map((sec: SeccionModel) => {
            const itemUpdate = <ItemModel>sec.items.filter((x: ItemModel) => x.isporcion !== 'ND' && x.idcarta_lista === item.idcarta_lista)[0];
            if (itemUpdate) {
              itemUpdate.cantidad = parseInt(itemUpdate.cantidad.toString(), 0) + item.cantidad_seleccionada;
            }
          });
        });

        // this.laCartaObjSource.next(this.objCarta);
      }
    });


    // valor en blanco para nuevo pedido
    this.prepareNewPedido();
    // this.storageService.clear('sys::h');
    // this.storageService.clear('sys::order');
    // this.storageService.clear('sys::order::all');
    // this.listItemsPedido = [];
    // this.miPedido = new PedidoModel();
    // this.miPedidoSource.next(this.miPedido);
    // this.countItemsSource.next(0);
  }

  getEstadoStockItem(stock: number): string {
    return stock > 10 ? 'verde' : stock > 5 ? 'amarillo' : 'rojo';
  }

  // isTimeLimit(): boolean {
  //   const h2 = this.storageService.get('sys::h');
  //   const hora1 = this.time.getTime().toString().split(':');
  //   const hora2 = h2.split(':');
  //   const t1 = new Date();
  //   const t2 = new Date();

  //   // tslint:disable-next-line: radix
  //   t1.setHours(parseInt(hora2[0], 0), parseInt(hora2[1], 0), parseInt(hora2[2], 0));
  //   t2.setHours(this.time.getHours(), this.time.getMinutes(), this.time.getSeconds());
  //   const dif = t2.getTime() - t1.getTime(); // diferencia en milisegundos
  //   const difSeg = Math.floor(dif / 1000);
  //   const difMin = Math.floor(difSeg / 60);
  //   let minutos = difMin % 60; // minutos
  //   minutos = minutos < 0 ? minutos * -1 : minutos;
  //   return minutos > this.max_minute_order ? true : false;

  // }

  // <------ storage ---- > ///


  // <------ reglas de la carta ----> //

  validarReglasCarta(rules: any[]): any {
    // let diferencia = 0;
    let xSecc_bus = 0;
    let xSecc_detalle = 0;
    let xCantidadBuscar = 0;
    let xCantidadBuscarSecc_detalle = 0;
    let diferencia = 0;

    let xPrecio_item_bus = 0;
    let xPrecio_mostrado = 0; // preciounitario * cantidad precio_total_cal

    // reset precio_total_calc -> precio_total;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((z: SeccionModel) => {
          z.items.map((n: ItemModel) => n.precio_total_calc = null);
        });
      });

    rules.map((regla: any) => {
      xSecc_bus = regla.idseccion;
      xSecc_detalle = regla.idseccion_detalle;
      xCantidadBuscar = this.countCantItemsFromSeccion(xSecc_bus);
      xCantidadBuscarSecc_detalle = this.countCantItemsFromSeccion(xSecc_detalle);

      diferencia = xCantidadBuscar - xCantidadBuscarSecc_detalle;
      diferencia = diferencia < 0 ? xCantidadBuscar : diferencia; // no valores negativos
      // console.log('diferencia reglas', diferencia);

      this.miPedido.tipoconsumo
        .map((tpc: TipoConsumoModel) => {
          tpc.secciones
            .filter((z: SeccionModel) => z.idseccion.toString() === xSecc_detalle.toString())
            .map((z: SeccionModel) => {
              z.items
                .map((n: ItemModel, i) => {
                  const precioUnitario_item = parseFloat(n.precio);
                  const cant_item = n.cantidad_seleccionada;

                  xPrecio_mostrado = n.precio_total_calc !== null ? n.precio_total_calc : n.precio_total;
                  xPrecio_item_bus = xPrecio_mostrado;

                  if ( xCantidadBuscar >= xCantidadBuscarSecc_detalle) {
                    xPrecio_item_bus = 0;
                  } else if (diferencia > 0) {
                    xPrecio_item_bus = diferencia * precioUnitario_item;
                    xPrecio_item_bus = xPrecio_mostrado - xPrecio_item_bus; // descuenta del precio que se muestra en pantalla( precio que ya fue procesado)
                    xPrecio_item_bus = xPrecio_item_bus < 0 ? 0 : xPrecio_item_bus;

                    diferencia = diferencia - cant_item < 0 ? 0 : diferencia - cant_item;
                  }

                  n.precio_total_calc = parseFloat(xPrecio_item_bus.toString()); //
                  n.precio_print = parseFloat(xPrecio_item_bus.toString()); //
                  n.cantidad_descontado = cant_item;
                });
            });
        });

    });
  }

  private countCantItemsFromSeccion(seccionSearch: number): number {
    let sum = 0;
    this.miPedido.tipoconsumo
    .map((tpc: TipoConsumoModel) => {
      tpc.secciones.map((z: SeccionModel) => {
        sum += z.items
          .filter((x: ItemModel) => x.idseccion.toString() === seccionSearch.toString())
          .map((x: ItemModel) => x.cantidad_seleccionada)
          .reduce((a, b) => a + b, 0);
      });
    });

    return sum;
  }

  // devuelve cantidad item filtrando tipoconsumo y seccion
  private countCantItemsFromTpcSeccion(tipoconsumo: number, seccionSearch: number): number {
    let sum = 0;
    this.miPedido.tipoconsumo
    .filter((tpc: TipoConsumoModel) => tpc.idtipo_consumo.toString() === tipoconsumo.toString())
    .map((tpc: TipoConsumoModel) => {
      tpc.secciones
      .map((z: SeccionModel) => {
        sum += z.items
          .filter((x: ItemModel) => x.idseccion.toString() === seccionSearch.toString())
          .map((x: ItemModel) => x.cantidad_seleccionada)
          .reduce((a, b) => a + b, 0);
      });
    });

    return sum;
  }

  // <------ reglas de la carta ---->//

  // <------ sub totales ---->//

  // isClienteDelivery = si es delivery el costo del servicio es segun calculo

  getArrSubTotales(rulesSubTotales: any[]): any {
    const subTotal = this.getSubTotalMiPedido();
    let sumaTotal = subTotal;

    const arrSubtotales: any = [];
    let _arrSubtotales: any = {};

    _arrSubtotales.id = 0;
    _arrSubtotales.descripcion = 'SUB TOTAL';
    _arrSubtotales.esImpuesto = 0;
    _arrSubtotales.visible = true;
    _arrSubtotales.quitar = false;
    _arrSubtotales.tachado = false;
    _arrSubtotales.visible_cpe = true;
    _arrSubtotales.importe = parseFloat(subTotal.toString()).toFixed(2);

    arrSubtotales.push(_arrSubtotales);


    // porcentajes / impuestos / otros servicios
    const rptPorcentajes: any = [];
    const arrPorcentajes = rulesSubTotales.filter(x => x.tipo === 'p');
    arrPorcentajes.map(p => {
      const porcentaje = p.monto / 100;
      const isImpuesto = p.es_impuesto === 1 ? true : false;
      const isActivo = p.activo === 0 ? true : false;
      const importe = (subTotal * porcentaje).toFixed(2);
      const rpt: any = {};

      rpt.id = p.tipo + p.id;
      rpt.descripcion = p.descripcion;
      rpt.esImpuesto = p.es_impuesto;
      rpt.visible = true;
      rpt.quitar = false;
      rpt.tachado = false;
      rpt.visible_cpe = isImpuesto;

      // rpt.importe = isImpuesto ? isActivo ? importe : 0 : importe;
      // rpt.importe = parseFloat(rpt.importe.toString()).toFixed(2);
      // sumaTotal += parseFloat(rpt.importe);

      // implement igv 030220
      if ( rpt.descripcion === 'I.G.V') {
        rpt.importe = isActivo ? porcentaje : 0;
      } else {
        rpt.importe = isImpuesto ? isActivo ? importe : 0 : importe;
        rpt.importe = parseFloat(rpt.importe.toString()).toFixed(2);
        sumaTotal += parseFloat(rpt.importe);
      }

      // no muestra si tienen valor 0
      if ( rpt.importe !== 0 ) {
        rptPorcentajes.push(rpt);
      }

    });

    // otros no porcentajes // taper // delivery
    let importeOtros = 0;
    const rptOtros: any = [];
    const arrOtros = rulesSubTotales.filter(x => x.tipo === 'a');

    // si existe estableciiento en localstorage entonces es un clienteDelivery
    const isClienteDelivery = this.establecimientoService.get().idsede ? true : false;
    let isTieneDelivery = false; // si tiene la opcion de delivery configurado
    arrOtros.map(p => {
      const rpt: any = {};

      // si es servicio delivery y si es clienteDelivery
      if ( (p.descripcion.toUpperCase().indexOf('DELIVERY') > -1  || p.descripcion.toUpperCase().indexOf('ENTREGA') > -1) && isClienteDelivery) {
        isTieneDelivery = true;
        p.descripcion = 'Entrega';
        importeOtros = this.establecimientoService.get().c_servicio;
      } else {
        importeOtros = parseFloat(p.monto); // aplica a todo el pedido
      }

      // const cantidad = this.countCantItemsFromTpcSeccion(p.idtipo_consumo, p.idseccion);
      // if ( cantidad === 0 ) { return; } // si no encontro items con esos criterios

      if (p.nivel === 0) { // aplica por item
        const cantidad = this.countCantItemsFromTpcSeccion(p.idtipo_consumo, p.idseccion);
        if ( cantidad === 0 ) { return; } // si no encontro items con esos criterios

        importeOtros = cantidad * parseFloat(p.monto);
      }

      rpt.id = p.tipo + p.id;
      rpt.descripcion = p.descripcion;
      rpt.esImpuesto = p.es_impuesto;
      rpt.visible = true;
      rpt.quitar = true;
      rpt.tachado = false;
      rpt.visible_cpe = false;
      rpt.importe = parseFloat(importeOtros.toString()).toFixed(2);

      sumaTotal += parseFloat(rpt.importe);

      // juntar si son del mismo tipo ej: taper - llevar, taper - delivery
      const findItem = rptOtros.filter((x: any) => x.descripcion === rpt.descripcion)[0];
      if (findItem) {
        findItem.importe += parseFloat(rpt.importe);
      } else {
        rptOtros.push(rpt);
      }


    });

    // si no tiene la opcion delivery y es un clienteDelivery lo agrega
    if ( !isTieneDelivery && isClienteDelivery) {
      const rpt: any = {};
      rpt.id = -2;
      rpt.descripcion = 'Entrega';
      rpt.esImpuesto = 0;
      rpt.visible = true;
      rpt.quitar = false;
      rpt.tachado = false;
      rpt.visible_cpe = false;
      rpt.importe = parseFloat(this.establecimientoService.get().c_servicio.toString()).toFixed(2);
      // rpt.importe = parseFloat(importeOtros.toString()).toFixed(2);

      sumaTotal += parseFloat(rpt.importe);

      rptOtros.push(rpt);
    }

    // juntamos
    rptPorcentajes.map(y => arrSubtotales.push(y));
    rptOtros.map(y => arrSubtotales.push(y));

    // IGV filtramos los que no es impuesto IGV | 030220
    const rowSubTotal =  arrSubtotales.filter(x => x.descripcion === 'SUB TOTAL')[0];
    const rowImporteIGV = arrSubtotales.filter(x => x.descripcion === 'I.G.V')[0];
    let _importeIGV = rowImporteIGV ? rowImporteIGV.importe : 0;
    let _importeSubTotal = rowSubTotal ? rowSubTotal.importe : 0;

    if ( _importeIGV > 0 ) {
      _importeIGV = parseFloat((_importeSubTotal *  _importeIGV).toString()).toFixed(2);
      _importeSubTotal = _importeSubTotal - _importeIGV;
      rowImporteIGV.importe = _importeIGV;
      rowSubTotal.importe = _importeSubTotal.toFixed(2);
    }
    /// IGV --->

    _arrSubtotales = {};
    _arrSubtotales.id = 0;
    _arrSubtotales.esImpuesto = 0;
    _arrSubtotales.descripcion = 'TOTAL';
    _arrSubtotales.visible = true;
    _arrSubtotales.quitar = false;
    _arrSubtotales.tachado = false;
    _arrSubtotales.visible_cpe = true;
    _arrSubtotales.importe = parseFloat(sumaTotal.toString()).toFixed(2);

    arrSubtotales.push(_arrSubtotales);

    console.log('totales', arrSubtotales);
    return  arrSubtotales;

  }

  private getSubTotalMiPedido(): number {
    let sumSubTotal = 0;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((z: SeccionModel) => {
          sumSubTotal += z.items
            .map((x: ItemModel) => x.precio_print)
            .reduce((a, b) => a + b, 0);
        });
      });

    return sumSubTotal;
  }

  // devuelve el importe total del item de la lista mi pedido
  getImporteTotalItemFromMiPedido(item: ItemModel): number {
    // const _itemFind = this.findOnlyItemMiPedido(item);
    // return _itemFind ? _itemFind.precio_total : 0;

    let sumSubTotal = 0;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((z: SeccionModel) => {
          sumSubTotal += z.items
            .filter((x: ItemModel) => x.iditem === item.iditem)
            .map((x: ItemModel) => x.precio_print)
            .reduce((a, b) => a + b, 0);
        });
      });

    return sumSubTotal;
  }


  // <------ sub totales ---->//

  // <------- timer limit ----> //

  private playTimerLimit(): void {
    this.timerLimitService.playCountTimerLimit();
  }

  private stopTimerLimit(): void {
    this.timerLimitService.resetCountTimerLimit();
  }

  public restoreTimerLimit(): void {
    this.timerLimitService.resetCountTimerLimit();
  }

  // <------- timer limit ----> //


  // <--------- listen change -------> //
  // escuha todos los cambios echos en las cantidades, from carta y listItemPedido ----resumen pedido
  listenChangeCantItem(): void {
    this.socketService.onItemModificado().subscribe((res: any) => {

      let _itemInCarta: ItemModel;
      // tiene lista de items en porciones compartidaas (Ej 1/8 pollo 1/4 pollo)
      if ( res.listItemPorcion != null ) {
        res.listItemPorcion.map((x: any) => {
          _itemInCarta = this.findItemCartaByIdCartaLista(x.idcarta_lista);

          const cantidadSet = parseInt(x.cantidad, 0);
          _itemInCarta.cantidad = cantidadSet ? cantidadSet : parseInt(res.item.cantidad.toString(), 0);
          this.setCantidadItemModificadoPwa(res.item, _itemInCarta, parseInt(x.cantidad, 0), true);
        });
      } else {
        res = res.item;
        _itemInCarta = this.findItemCarta(res);
        this.setCantidadItemModificadoPwa(res, _itemInCarta);
      }


      // actualiza subitems si son porciones o productos


      // const _itemInList = this.findItemListPedido(res);

      // _itemInCarta.subitems = res.subitems;
      // actualizar cantidades subitems si existe
      // if ( res.subitems ) {
      //   // res.subitems.map((asub: SubItem) => {
      //   //   // _itemInCarta.subitems.filter((bsub: SubItem) => asub.iditem_subitem === bsub.iditem_subitem)[0].cantidad = asub.cantidad;

      //   // });
      //   res.subitems.map((subitemOp: SubItemContent) => {
      //     subitemOp.opciones.map((subitem: SubItem) => {
      //       _itemInCarta.subitems.map((s: SubItemContent) => {
      //         const itemFind = s.opciones.filter((_subItem: SubItem) => _subItem.iditem_subitem === parseInt(subitem.iditem_subitem.toString(), 0))[0];
      //         if ( itemFind ) {
      //           itemFind.cantidad = subitem.cantidad;
      //         }
      //       });
      //     });
      //   });

      //   // _itemInCarta.subitems = res.subitems;
      // }

      // _itemInCarta.cantidad = parseInt(res.cantidad.toString(), 0);


      // this.itemStockChangeSource.next(_itemInCarta);
      console.log('socket list', this.listItemsPedido);
    });

    this.socketService.onItemResetCant().subscribe((res: any) => {

      let _itemInCarta: ItemModel;
      // tiene lista de items en porciones compartidaas (Ej 1/8 pollo 1/4 pollo)
      if ( res.listItemPorcion != null ) {
        res.listItemPorcion.map((x: any) => {
          _itemInCarta = this.findItemCartaByIdCartaLista(x.idcarta_lista);
          _itemInCarta.cantidad = parseInt(x.cantidad, 0);
          this.setCantidadItemModificadoPwa(res.item, _itemInCarta, parseInt(x.cantidad, 0), true);
          // _itemInCarta.subitems = res.subitems;
          this.itemStockChangeSource.next(_itemInCarta);
        });
      } else {
        res = res.item;
        _itemInCarta = this.findItemCarta(res);
        _itemInCarta.cantidad = parseInt(res.cantidad.toString(), 0);
        _itemInCarta.subitems = res.subitems;
        this.itemStockChangeSource.next(_itemInCarta);
        // this.setCantidadItemModificadoPwa(res.item, _itemInCarta);
      }
      // const _itemInCarta = this.findItemCarta(res);
      // const _itemInList = this.findItemListPedido(res);
      // _itemInCarta.cantidad = Number.parseFloat(_itemInCarta.cantidad.toString()) +  Number.parseFloat(res.cantidad_reset.toString());

      // _itemInCarta.cantidad = parseInt(res.cantidad.toString(), 0);
      // _itemInCarta.subitems = res.subitems;
      // console.log('cant reset ', _itemInCarta);
      // this.itemStockChangeSource.next(_itemInCarta);
      // _itemInList.cantidad += res.cantidad_reset;
    });

    // from monitoreo stock - add item in carta
    this.socketService.onNuevoItemAddInCarta().subscribe((res: any) => {
      console.log('onNuevoItemAddInCarta', res);
      this.addItemInCarta(res);
    });

    // tiempo limite

    this.socketService.onGetDatosSede().subscribe((res: any) => {
      this.objDatosSede = res[0];
      this.listenStatusService.setHayDatosSede(true);
      // nombre sede
      localStorage.setItem('sys::s', this.objDatosSede.datossede[0].nombre + '|' + this.objDatosSede.datossede[0].ciudad);
      console.log('datos de la sede ps', this.objDatosSede);


      this.max_minute_order = res[0].datossede[0].pwa_time_limit;
      this.timerLimitService.maxTime = this.max_minute_order * 100;
    });

    this.timerLimitService.countdown$.subscribe((countTime: number) => {
      switch (countTime) {
        case 1:
          // if ( this._snackBar._openedSnackBarRef ) {return; }
          // this._snackBar.open(`Recuerde, ${this.max_minute_order} minutos para enviar su pedido.`, '', {
          //   duration: 3000,
          // });
          this.isPreAvisoVisible = false;
          break;
        case 80:
          if (!this.isPreAvisoVisible) {
            this.isPreAvisoVisible = true;
            this._snackBar.open('Proximo a cumplir el tiempo de envio.', '', {
              duration: 2000,
            });
          }
          break;
        case 100:
          this._snackBar.open('Tiempo agotado, debe realizar un nuevo pedido.', '', {
            duration: 3000,
          });
          break;
      }
    });

    this.timerLimitService.isTimeLimitComplet$.subscribe((res: boolean) => {
      // tiempo completado // reseteamos
      if (res === true) {
        this.resetAllNewPedido();
        this.navigatorService.setPageActive('carta');
      }
    });
  }

  setCantidadItemModificadoPwa(res: ItemModel, _itemInCarta: ItemModel, cantidadSet: number = null, isSubItemPorcion: boolean = false) {
    // actualizar cantidades subitems si existe
    if ( res.subitems && res.idcarta_lista === _itemInCarta.idcarta_lista ) {

      // if ( !isReset ) {
      //   _itemInCarta.cantidad = cantidadSet ? cantidadSet : parseInt(res.cantidad.toString(), 0);
      // }
      // res.subitems.map((asub: SubItem) => {
      //   // _itemInCarta.subitems.filter((bsub: SubItem) => asub.iditem_subitem === bsub.iditem_subitem)[0].cantidad = asub.cantidad;

      // });
      res.subitems.map((subitemOp: SubItemContent) => {
        subitemOp.opciones.map((subitem: SubItem) => {
          _itemInCarta.subitems.map((s: SubItemContent) => {
            const itemFind = s.opciones.filter((_subItem: SubItem) => _subItem.iditem_subitem === parseInt(subitem.iditem_subitem.toString(), 0))[0];
            if ( itemFind ) {
              if ( itemFind.cantidad !== 'ND' ) {
                itemFind.cantidad = subitem.cantidad;

                // buscar los demas items que tengan este subitem porcion o producto
                const idFind = itemFind.idproducto.toString() + itemFind.idporcion.toString();
                const _otherListSubItem = this.findSubItemCartaById(idFind, res.iditem.toString());
                _otherListSubItem.map( (x: SubItem ) => {
                  x.cantidad = subitem.cantidad;
                });

              }
            }
          });
        });
      });

      // _itemInCarta.subitems = res.subitems;
    }

    // _itemInCarta.cantidad = parseInt(res.cantidad.toString(), 0);
    // _itemInCarta.cantidad = cantidadSet ? cantidadSet : parseInt(res.cantidad.toString(), 0);

    if ( !isSubItemPorcion ) {
        _itemInCarta.cantidad = cantidadSet ? cantidadSet : parseInt(res.cantidad.toString(), 0);
    }

    this.itemStockChangeSource.next(_itemInCarta);
  }

  // cerrar session
  cerrarSession(): void {
    this.socketService.closeConnection();
    this.navigatorService.cerrarSession();
  }

  // <--------- listen change -------> //
}
