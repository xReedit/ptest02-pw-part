import { SeccionModel } from './seccion.model';

export class TipoConsumoModel {
    idtipo_consumo: number;
    descripcion: string;
    titulo: string;
    count_items_seccion: number;
    secciones: SeccionModel[] = [];
}
