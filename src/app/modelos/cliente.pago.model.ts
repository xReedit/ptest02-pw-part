export class ClientePagoModel {
    idcliente: string;
    idcliente_card: string; // id cliente para antifraud y guardar sus tarjetas;
    nombres: string;
    nombre: string;
    apellido: string;
    email: string;
    isSaveEmail: boolean; // si se guarda email
    diasRegistrado: string; // dias que el cliente esta registrado / viene del server
    ip: string; // ip del cliente
    nomComercio: string; // nombre sede que se muestra en el form de pago
}
