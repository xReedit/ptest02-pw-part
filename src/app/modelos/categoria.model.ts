import { SeccionModel } from './seccion.model';

export class CategoriaModel {
    idcarta: number;
    idcategoria: number;
    visible_x_hora: number;
    hora_fin: string;
    hora_ini: string;
    des: string;
    detalle: string;
    secciones: SeccionModel[];
}
