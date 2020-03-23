export class EstadoPedidoModel {
    estado: number; // 0: espera 1: despachado 2: pagado 3: anulado
    importe: number; // importe a pagar
    isTiempoAproxCumplido: boolean; // si el tiempo aproximado esta cumplido
    horaInt: number; // hora init conteo
    numMinAprox: number; // numero de minutos aproximadamente
    hayPedidoCliente: boolean; // si hay pedido, si hay cuenta
    hayPedidoClientePendiente: boolean; // si hay productos en lista de pedido pendientes por enviar.
    isPagada: boolean; // si ya fue pagada
    isRegisterOnePago: boolean; // si se registro algun pago aunque no se el total
}
