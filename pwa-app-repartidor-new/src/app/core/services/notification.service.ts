import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Capacitor } from '@capacitor/core';
import { Subject } from 'rxjs';

export interface AppNotification {
    title: string;
    body: string;
    data?: any;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    // Observable para cuando se recibe una notificación
    private notificationReceived = new Subject<AppNotification>();
    public notification$ = this.notificationReceived.asObservable();

    // Estado del permiso
    private _permissionGranted = false;
    public get permissionGranted(): boolean {
        return this._permissionGranted;
    }

    constructor(
        private http: HttpService,
        private auth: AuthService
    ) { }

    async init() {

        if (Capacitor.getPlatform() === 'web') {
            await this.initWebPush();
        } else {
            await this.initNativePush();
        }
    }

    /**
     * Inicializa Web Push usando la Notification API del navegador
     */
    private async initWebPush() {

        if (!('Notification' in window)) {

            return;
        }

        // Verificar permiso actual

        if (Notification.permission === 'granted') {
            this._permissionGranted = true;

        } else if (Notification.permission === 'default') {
            // Solicitar permiso
            const permission = await Notification.requestPermission();

            this._permissionGranted = permission === 'granted';
        } else {

            this._permissionGranted = false;
        }

        if (this._permissionGranted) {
            // Generar un token simulado para web
            const webToken = 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            this.saveToken(webToken);
        }
    }

    /**
     * Inicializa Push nativo con Capacitor
     */
    private async initNativePush() {

        try {
            const permResult = await PushNotifications.requestPermissions();

            if (permResult.receive === 'granted') {
                this._permissionGranted = true;
                await PushNotifications.register();
            } else {

                return;
            }

            PushNotifications.addListener('registration', token => {

                this.saveToken(token.value);
            });

            PushNotifications.addListener('registrationError', error => {

            });

            PushNotifications.addListener('pushNotificationReceived', notification => {

                this.notificationReceived.next({
                    title: notification.title || 'Notificación',
                    body: notification.body || '',
                    data: notification.data
                });
            });

            PushNotifications.addListener('pushNotificationActionPerformed', notification => {

            });
        } catch (error) {


        }
    }

    /**
     * Muestra una notificación local (funciona tanto en web como para pruebas)
     */
    showLocalNotification(title: string, body: string, data?: any): boolean {

        if (Capacitor.getPlatform() === 'web') {
            if (!this._permissionGranted) {

                return false;
            }

            const notification = new Notification(title, {
                body: body,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-72x72.png',
                data: data,
                requireInteraction: true
            });

            notification.onclick = () => {

                window.focus();
                notification.close();
            };

            // Emitir el evento
            this.notificationReceived.next({ title, body, data });
            return true;
        }

        // Para nativo, también emitimos el evento
        this.notificationReceived.next({ title, body, data });
        return true;
    }

    /**
     * Solicita permiso de notificaciones manualmente
     */
    async requestPermission(): Promise<boolean> {

        if (Capacitor.getPlatform() === 'web') {
            if (!('Notification' in window)) {
                return false;
            }
            const permission = await Notification.requestPermission();
            this._permissionGranted = permission === 'granted';

            return this._permissionGranted;
        } else {
            const result = await PushNotifications.requestPermissions();
            this._permissionGranted = result.receive === 'granted';
            if (this._permissionGranted) {
                await PushNotifications.register();
            }
            return this._permissionGranted;
        }
    }

    async getPermissionStatus(): Promise<string> {
        if (Capacitor.getPlatform() === 'web') {
            if (!('Notification' in window)) return 'unsupported';
            return Notification.permission;
        } else {
            const status = await PushNotifications.checkPermissions();
            return status.receive;
        }
    }

    /**
     * Método de prueba - simula recibir una notificación de nuevo pedido
     */
    testNewOrderNotification() {
        const testData = {
            idpedido: 12345,
            tipo: 'nuevo_pedido',
            comercio: 'Restaurante Demo'
        };

        this.showLocalNotification(
            '🛵 ¡Nuevo Pedido!',
            'Tienes un nuevo pedido de Restaurante Demo',
            testData
        );
    }

    /**
     * Método de prueba - simula diferentes tipos de notificaciones
     */
    testNotification(type: 'order' | 'delivery' | 'message' | 'custom', customMessage?: string) {
        const notifications: Record<string, { title: string; body: string }> = {
            order: { title: '🛵 ¡Nuevo Pedido!', body: 'Tienes un nuevo pedido asignado' },
            delivery: { title: '✅ Entrega Confirmada', body: 'El cliente ha confirmado la entrega' },
            message: { title: '💬 Nuevo Mensaje', body: 'El cliente te ha enviado un mensaje' },
            custom: { title: '📢 Notificación', body: customMessage || 'Mensaje de prueba' }
        };

        const notif = notifications[type];
        this.showLocalNotification(notif.title, notif.body, { type });
    }

    private saveToken(token: string) {
        const user = this.auth.currentUser();
        if (!user || !user.idcliente) {

            return;
        }

        const payload = {
            suscripcion: {
                endpoint: token,
                expirationTime: null,
                keys: {
                    p256dh: Capacitor.getPlatform() === 'web' ? 'web-app' : 'native-app',
                    auth: Capacitor.getPlatform() === 'web' ? 'web-app' : 'native-app'
                }
            },
            idcliente: user.idcliente
        };

        this.http.post('repartidor/push-suscripcion', payload, true).subscribe({
            next: () => {},
            error: () => {}
        });
    }
}
