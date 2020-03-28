export class PedidoRepartidorModel {
    idpedido: number;
    estado: number; // 0 = por aceptar 1 = aceptado
    datosDelivery: any;
    datosCliente: any;
    datosComercio: any;
    paso_va: number; // paso en que va 1=ir a comercio 2=recoger 3 entregar
}
