import { ItemModel } from './item.model';

export class SeccionModel {
    idseccion: number;
    idimpresora: number;
    imprimir: number;
    sec_orden: number;
    count_items: number;
    ver_stock_cero: number;
    des: string;

    items: ItemModel[] = [];
}
