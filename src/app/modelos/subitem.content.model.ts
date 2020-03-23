import { SubItem } from './subitems.model';

export class SubItemContent {
    iditem_subitem_content: number;
    iditem: number;
    des: string;
    subitem_required_select: number;
    subitem_cant_select: number;
    isSoloUno: boolean;
    isObligatorio: boolean;
    des_cant_select: string;
    opciones: SubItem[];
}
