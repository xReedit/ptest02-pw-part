import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { HttpService } from './http.service';
import { Router } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface UsuarioTokenModel {
    idcliente?: number;
    idorg?: number;
    idsede?: number;
    nombres?: string;
    usuario?: {
        idrepartidor?: number;
        idsede_suscrito?: number;
        nombre?: string;
        apellido?: string;
        usuario?: string;
        telefono?: string;
        pass?: string;
        ciudad?: string;
    };
    idusuario?: number;
    isDelivery?: boolean;
    socketId?: string;
    // Mantengo idsede_suscrito en el root por compatibilidad si fuera necesario, 
    // pero el debugger muestra que está dentro de 'usuario'
    idsede_suscrito?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = '::token';
    private readonly TOKEN_AUTH_KEY = '::token-auth';

    // Signals for reactive state
    currentUser = signal<UsuarioTokenModel | any>(null);
    isAuthenticated = computed(() => !!this.currentUser());
    isReady = signal<boolean>(false);
    
    // Estado online/offline del repartidor (para recibir pedidos)
    private readonly ONLINE_STATUS_KEY = '::repartidor-online';
    isOnline = signal<boolean>(false);

    constructor(
        private storage: StorageService,
        private http: HttpService,
        private router: Router
    ) { }

    async init() {
        if (this.isReady()) return;

        const token = await this.storage.get(this.TOKEN_KEY);

        if (token) {

            this.decodeAndSetUser(token);
            
            // Cargar estado online guardado
            await this.loadOnlineStatus();
        } else {

        }

        this.isReady.set(true);

    }
    
    /**
     * Cargar el estado online guardado en storage
     */
    private async loadOnlineStatus() {
        const savedStatus = await this.storage.get(this.ONLINE_STATUS_KEY);
        // Por defecto offline cuando se inicia la app
        this.isOnline.set(savedStatus === 'true' || savedStatus === true);

    }
    
    /**
     * Cambiar el estado online del repartidor
     * Actualiza el estado local y notifica al servidor
     */
    async toggleOnlineStatus() {
        const newStatus = !this.isOnline();
        this.isOnline.set(newStatus);
        await this.storage.set(this.ONLINE_STATUS_KEY, newStatus.toString());
        
        // Notificar al servidor sobre el cambio de estado
        await this.notifyOnlineStatusToServer(newStatus);

        return newStatus;
    }
    
    /**
     * Establecer el estado online del repartidor
     * Actualiza el estado local y notifica al servidor
     */
    async setOnlineStatus(status: boolean) {
        this.isOnline.set(status);
        await this.storage.set(this.ONLINE_STATUS_KEY, status.toString());
        
        // Notificar al servidor sobre el cambio de estado
        await this.notifyOnlineStatusToServer(status);

    }
    
    /**
     * Notificar al servidor el estado online del repartidor
     */
    private async notifyOnlineStatusToServer(isOnline: boolean) {
        try {
            const user = this.currentUser();
            if (!user?.usuario?.idrepartidor) {

                return;
            }
            
            const response = await this.http.post('repartidor/set-efectivo-mano', {
                idrepartidor: user.usuario.idrepartidor,
                online: isOnline ? 1 : 0
            }).toPromise();

        } catch (error) {

        }
    }

    private decodeAndSetUser(token: string) {
        try {
            if (!token || !token.includes('.')) {
                throw new Error('Token format invalid: missing dot');
            }

            const parts = token.split('.');
            if (parts.length < 2) {
                throw new Error('Token format invalid: missing payload');
            }

            const payload = parts[1];
            // Fix base64 padding if necessary
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(atob(base64));

            this.currentUser.set(decoded);
        } catch (e) {

            // Si el token es inválido, mejor lo borramos silenciosamente en el init 
            // pero NO llamamos a logout() aquí porque logout() hace un navigate 
            // y el router podría no estar listo todavía durante el boot.
            this.storage.remove(this.TOKEN_KEY);
            this.storage.remove(this.TOKEN_AUTH_KEY);
            this.currentUser.set(null);
        }
    }

    login(credentials: { nomusuario: string; pass: string }): Observable<any> {
        // Legacy endpoint: login-usuario-autorizado-repartidor
        return this.http.post('login-usuario-autorizado-repartidor/', credentials).pipe(
            switchMap(async (response: any) => {
                if (response && response.success === false) {
                    throw new Error(response.error || 'Credenciales Incorrectas');
                }

                if (response && response.token) {
                    // Esperar a que los tokens se guarden realmente
                    await this.storage.set(this.TOKEN_KEY, response.token);
                    if (response.token_auth) {
                        await this.storage.set(this.TOKEN_AUTH_KEY, response.token_auth);
                    }
                    this.decodeAndSetUser(response.token);
                }
                return response;
            })
        );
    }

    async logout() {
        await this.storage.clear();
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    async getToken(): Promise<string | null> {
        return await this.storage.get(this.TOKEN_KEY);
    }

    async getTokenAuth(): Promise<string | null> {
        return await this.storage.get(this.TOKEN_AUTH_KEY);
    }
}
