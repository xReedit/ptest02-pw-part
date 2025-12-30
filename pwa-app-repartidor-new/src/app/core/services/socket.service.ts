import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket | undefined;
    private url = environment.urlServerSocket;
    private subjects: Map<string, Subject<any>> = new Map();

    constructor(private authService: AuthService) { }

    connect() {
        if (this.socket && this.socket.connected) {
            return;
        }

        const user = <any>this.authService.currentUser();
        if (!user) {

            return;
        }

        const query = {
            idrepartidor: user.usuario.idrepartidor,
            online: this.authService.isOnline() ? 1 : 0,
            isFromApp: 1,
            isRepartidor: true,
            firts_socketid: user.socketId
        };

        this.socket = io(this.url, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            query: query
        });

        if (this.socket) {
            this.socket.on('connect', () => {

                this.registerUser();
                this.reattachListeners();
            });

            this.socket.on('disconnect', () => {

            });

            this.socket.on('error', (err: any) => {

            });
        }
    }

    private reattachListeners() {
        if (!this.socket) return;

        this.subjects.forEach((subject, eventName) => {
            this.socket?.off(eventName); // Evitar duplicados
            this.socket?.on(eventName, (data: any) => {
                subject.next(data);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
        }
    }

    private async registerUser() {
        const user = this.authService.currentUser();
        if (user && this.socket) {
            const query = {
                idrepartidor: user.usuario.idrepartidor,
                online: this.authService.isOnline() ? 1 : 0
            };

            this.socket.emit('query', query);

            // Solo solicitar pedidos pendientes si está online
            if (this.authService.isOnline()) {
                setTimeout(() => {

                    this.socket?.emit('repartidor-get-pedido-pendiente-aceptar', query);
                }, 800);
            }
        }
    }
    
    /**
     * Actualizar el estado online del repartidor en el servidor
     */
    updateOnlineStatus(isOnline: boolean) {
        const user = this.authService.currentUser();
        if (user && this.socket) {
            const query = {
                idrepartidor: user.usuario.idrepartidor,
                online: isOnline ? 1 : 0
            };

            this.socket.emit('query', query);
            
            // Si se pone online, solicitar pedidos pendientes
            if (isOnline) {
                setTimeout(() => {
                    this.socket?.emit('repartidor-get-pedido-pendiente-aceptar', query);
                }, 500);
            }
        }
    }

    listen(eventName: string): Observable<any> {
        let subject = this.subjects.get(eventName);

        if (!subject) {
            subject = new Subject<any>();
            this.subjects.set(eventName, subject);

            // Si el socket ya está conectado, adjuntamos de una vez
            if (this.socket && this.socket.connected) {
                this.socket.on(eventName, (data: any) => {
                    subject?.next(data);
                });
            }
        }

        return subject.asObservable();
    }

    emit(eventName: string, data: any) {
        if (this.socket) {
            this.socket.emit(eventName, data);
        } else {

        }
    }
}
