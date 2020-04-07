export class PedidoRepartidorModel {
    idpedido: number;
    estado: number; // 0 = por aceptar 1 = aceptado
    datosItems: any; // item productos
    datosDelivery: any;
    datosCliente: any;
    datosRepartidor: any;
    datosComercio: any;
    datosSubtotales: any;
    datosSubtotalesShow: any; // el que muestra en detalle del pedido
    c_servicio: string; // costo total de servicio + propina
    importePedido: string; // importe total del pedido quitando serivico + propina
    importePagaCliente: string; // importe neto que paga el cliente
    isHayPropina: boolean; // indica si el pedido tiene propina
    paso_va: number; // paso en que va 1=ir a comercio 2=recoger 3 entregar
}
