export class TimeLinePedido {    
    hora_pedido_aceptado: number;
    hora_pedido_entregado: number;    
    llego_al_comercio: boolean;
    en_camino_al_cliente: boolean;
    mensaje_enviado: {
        llego_al_comercio: boolean;
        en_camino_al_cliente: boolean;
    };
    paso: number; // 1 llego al comercio // 2 en camino // 3 entregado        
}
