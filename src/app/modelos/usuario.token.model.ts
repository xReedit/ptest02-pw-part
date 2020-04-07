import { DeliveryDireccionCliente } from './delivery.direccion.cliente.model';
import { MetodoPagoModel } from './metodo.pago.model';

export class UsuarioTokenModel {
    acc: string;
    cargo: string;
    estadistica: number;
    estado: number;
    idalmacen: number;
    idorg: number;
    idsede: number;
    idusuario: number;
    nombres: string;
    nuevo: number;
    pass: string;
    per: string;
    rol: number;
    super: number;
    usuario: any;
    idcliente: number;
    isCliente: boolean;
    email: string;
    numMesaLector: number; // numero de mesa del lector qr
    ipCliente: string; // ip del cliente api autorizacion
    isSoloLLevar: boolean; // si escanea qr solo para llevar
    isDelivery: boolean; // si es delivery
    direccionEnvioSelected: DeliveryDireccionCliente;
    telefono: string;
    orderDelivery: string; // pedido pendiente de confirmacion
    importeDelivery: string; // importe pendiente de confirmacion
    isPagoSuccess: boolean; // si ya pago, si es que actualiza cuando ya pago
    metodoPago: MetodoPagoModel; // metodo pago seleccionado
    efectivoMano: number; // repartidor efectivo en mano
    isOnline: boolean; // si esta en linea activo
    socketId: string; // guarda el socket id de conexion, para mantenerlo
}
