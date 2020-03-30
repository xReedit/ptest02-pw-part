export class PedidoRepartidorModel {
    idpedido: number;
    estado: number; // 0 = por aceptar 1 = aceptado
    datosDelivery: any;
    datosCliente: any;
    datosComercio: any;
    datosSubtotales: any;
    c_servicio: string; // costo total de servicio + propina
    importePedido: string; // importe total del pedido quitando serivico + propina
    isHayPropina: boolean; // indica si el pedido tiene propina
    paso_va: number; // paso en que va 1=ir a comercio 2=recoger 3 entregar
}
