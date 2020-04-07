export class DatosCalificadoModel {
    idrepartidor: number;
    idcliente: number;
    idpedido: number;
    idsede: number;
    nombre: string;
    titulo: string;
    calificacion: number;
    showNombre: boolean;
    showTitulo: boolean;
    showMsjTankyou: boolean; // si aparece el agradecimiento luego de calificar
    tipo: number; // 1 repartidor 2 cliente 3 establecimiento
}
