export interface TimeLinePedido {
    hora_pedido_aceptado?: number;
    hora_pedido_entregado?: number;
    llego_al_comercio: boolean;
    en_camino_al_cliente: boolean;
    mensaje_enviado?: {
        llego_al_comercio: boolean;
        en_camino_al_cliente: boolean;
    };
    paso: number; // 0=inicial, 1=llegó al comercio, 2=en camino, 3=entregado
    msj_log?: string;
    distanciaMtr?: string;
}

export function createDefaultTimeLine(): TimeLinePedido {
    return {
        llego_al_comercio: false,
        en_camino_al_cliente: false,
        paso: 0,
        mensaje_enviado: {
            llego_al_comercio: false,
            en_camino_al_cliente: false
        },
        msj_log: ''
    };
}
