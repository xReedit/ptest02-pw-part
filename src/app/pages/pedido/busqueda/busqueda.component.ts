import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css', '../pedido.style.css']
})
export class BusquedaComponent implements OnInit {

  objCartaBus: any = [];

  private itemSelected: ItemModel;
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];

  constructor(
    private socketService: SocketService,
    private miPedidoService: MipedidoService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  loadItemsBusqueda() {
    let _objFind: any;
    _objFind = this.miPedidoService.getObjCartaLibery();

    // extraemos
    let _itemFind: any;
    _objFind.carta.map((c: CategoriaModel) => {
      c.secciones.map((s: SeccionModel) => {
        s.items.map((i: ItemModel) => {
          _itemFind = i;
          _itemFind.seccion = s.des;
          _itemFind.selected = false;
          this.objCartaBus.push(_itemFind);
        });
      });
    });

    // tipo consumo
    this.objNewItemTiposConsumo = this.socketService.getDataTipoConsumo();
    console.log('_objFind', this.objCartaBus);
  }

  selectedItemBusq(selectedItem: ItemModel) {
    this.objCartaBus.map(x => x.selected = false);
    selectedItem.selected = true;
    this.itemSelected = selectedItem;

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = selectedItem.itemtiposconsumo ? selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !selectedItem.itemtiposconsumo ) {
      selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    this.openDlgItemBusq(selectedItem);
  }

  private openDlgItemBusq(_item: ItemModel): void {
    const dialogConfig = new MatDialogConfig();
    const _itemFromCarta = this.miPedidoService.findItemCarta(_item);

    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: null,
      // seccion: this.seccionSelected,
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

  getEstadoStockItem(stock: string): string {
    if ( stock === 'ND' ) {
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

}
