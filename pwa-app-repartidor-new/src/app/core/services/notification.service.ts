import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Capacitor } from '@capacitor/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

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

    private debugSubject = new Subject<string>();
    public debug$ = this.debugSubject.asObservable();

    // Estado del permiso
    private _permissionGranted = false;
    public get permissionGranted(): boolean {
        return this._permissionGranted;
    }

    constructor(
        private http: HttpService,
        private auth: AuthService
    ) { }

    private getRepartidorId(): number | null {
        const user: any = this.auth.currentUser();
        return user?.usuario?.idrepartidor ?? user?.idrepartidor ?? null;
    }

    private log(...args: any[]) {
        try {
            const msg = args
                .map(a => {
                    if (typeof a === 'string') return a;
                    try {
                        return JSON.stringify(a);
                    } catch {
                        return String(a);
                    }
                })
                .join(' ');
            this.debugSubject.next(msg);
        } catch {
            this.debugSubject.next('log() error serializando mensaje');
        }
    }

    async init() {
        this.log('init()', { platform: Capacitor.getPlatform(), isNative: Capacitor.isNativePlatform() });
        if (!Capacitor.isNativePlatform()) {
            await this.initWebPush();
        } else {
            await this.initNativePush();
        }
    }

    async debugRegisterNativePush() {
        this.log('debugRegisterNativePush()', { platform: Capacitor.getPlatform(), isNative: Capacitor.isNativePlatform() });
        if (!Capacitor.isNativePlatform()) {
            this.log('debugRegisterNativePush: NO es plataforma nativa, no aplica');
            return;
        }
        await this.initNativePush();
    }

    /**
     * Inicializa Web Push usando la Notification API del navegador
     */
    private async initWebPush() {
        if (!('Notification' in window)) {
            this.log('WebPush: Notification API no soportada');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            this.log('WebPush: ServiceWorker no soportado');
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

        this.log('WebPush permission', Notification.permission);

        if (this._permissionGranted) {
            const subscription = await this.getOrCreateWebPushSubscription();
            if (subscription) {
                this.saveWebPushSubscription(subscription);
            } else {
                this.log('WebPush: no se pudo obtener/crear subscription');
            }
        }
    }

    private async getOrCreateWebPushSubscription(): Promise<PushSubscription | null> {
        try {
            // Evitar cuelgue silencioso si no hay SW registrado
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('serviceWorker.ready timeout (no hay SW activo?)')), 5000)
                )
            ]);
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const vapidPublicKey = environment.vapidPublic;
                if (!vapidPublicKey) {
                    return null;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
                });
            }

            return subscription;
        } catch (e) {
            this.log('WebPush error getOrCreateWebPushSubscription', e);
            return null;
        }
    }

    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const arrayBuffer = new ArrayBuffer(rawData.length);
        const outputArray = new Uint8Array(arrayBuffer);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Inicializa Push nativo con Capacitor
     */
    private async initNativePush() {
        try {
            const permResult = await PushNotifications.requestPermissions();
            if (permResult.receive === 'granted') {
                this._permissionGranted = true;
            } else {
                this.log('NativePush: permisos NO otorgados', permResult);
                return;
            }

            // CRÍTICO: registrar listeners ANTES de register() para no perder el evento 'registration'
            PushNotifications.addListener('registration', token => {
                this.log('NativePush registration token recibido');
                this.saveFcmToken(token.value);
            });

            PushNotifications.addListener('registrationError', error => {
                this.log('NativePush registrationError', error);
            });

            PushNotifications.addListener('pushNotificationReceived', notification => {
                this.notificationReceived.next({
                    title: notification.title || 'Notificación',
                    body: notification.body || '',
                    data: notification.data
                });
            });

            PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                this.log('NativePush actionPerformed', notification);
            });

            await PushNotifications.register();
            this.log('NativePush: register() llamado');
        } catch (error) {
            this.log('NativePush init error', error);
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

    private saveWebPushSubscription(subscription: PushSubscription) {
        const idrepartidor = this.getRepartidorId();
        if (!idrepartidor) {
            this.log('saveWebPushSubscription: sin idrepartidor, no se envía');
            return;
        }

        const payload = {
            idrepartidor: idrepartidor,
            pwa_code_verification: JSON.stringify(subscription),
            fcm_token: null
        };

        this.log('saveWebPushSubscription POST', payload);
        this.http.post('repartidor/set-suscription-notification-push', payload, true).subscribe({
            next: (resp) => {
                this.log('saveWebPushSubscription OK', resp);
            },
            error: (err) => {
                this.log('saveWebPushSubscription ERROR', err);
            }
        });
    }

    private saveFcmToken(token: string) {
        const idrepartidor = this.getRepartidorId();
        if (!idrepartidor) {
            this.log('saveFcmToken: sin idrepartidor, no se envía');
            return;
        }

        const payload = {
            idrepartidor: idrepartidor,
            pwa_code_verification: null,
            fcm_token: token
        };

        this.log('saveFcmToken POST', payload);
        this.http.post('repartidor/set-suscription-notification-push', payload, true).subscribe({
            next: (resp) => {
                this.log('saveFcmToken OK', resp);
            },
            error: (err) => {
                this.log('saveFcmToken ERROR', err);
            }
        });
    }
}
