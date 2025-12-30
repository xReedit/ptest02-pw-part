import { Injectable, signal } from '@angular/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment';
import { Capacitor } from '@capacitor/core';


@Injectable({
    providedIn: 'root'
})
export class GeolocationService {
    currentPosition = signal<Position | null>(null);
    watchId: string | null = null;
    private simulationEnabled = false;

    constructor() { }

    async getCurrentPosition(): Promise<Position> {
        // If simulation is active, return the last simulated position
        if (this.simulationEnabled && this.currentPosition()) {
            return this.currentPosition()!;
        }

        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
        });
        this.currentPosition.set(coordinates);
        return coordinates;
    }

    /**
     * Tries to force the location service to turn on.
     * On Android, this might trigger the 'GMS Location' prompt.
     * If it fails (e.g. user denies, or 'Location services not enabled' error), 
     * it advises the user.
     */
    /**
     * Tries to force the location service to turn on.
     */
    async enableLocation(): Promise<boolean> {
        if (Capacitor.getPlatform() === 'web') {

            return false;
        }

        try {

            // En Android, esto debería mostrar el diálogo para activar el GPS
            await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

            return true;
        } catch (e: any) {

            // Si el error es porque el servicio no está habilitado (código 2)
            // el usuario debería haber visto el diálogo y puede haberlo rechazado
            return false;
        }
    }

    async getPermissionStatus(): Promise<string | 'off'> {
        try {
            const status = await Geolocation.checkPermissions();
            
            if (status.location !== 'granted') {
                return status.location as any;
            }

            // Si el permiso está granted, verificar si el servicio GPS está activo
            const serviceEnabled = await this.isLocationServiceEnabled();
            return serviceEnabled ? 'granted' : 'off';
        } catch (e) {

            return 'prompt';
        }
    }

    async checkPermissions(): Promise<boolean> {
        if (Capacitor.getPlatform() === 'web') {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve(true),
                    () => resolve(false),
                    { timeout: 5000 }
                );
            });
        }

        try {
            const status = await Geolocation.checkPermissions();
            if (status.location === 'granted') {
                return true;
            }

            // Si no está granted, solicitar permiso
            const request = await Geolocation.requestPermissions();
            return request.location === 'granted';
        } catch (e) {

            return false;
        }
    }

    // Helper probe (silent)
    async isLocationServiceEnabled(): Promise<boolean> {
        if (Capacitor.getPlatform() === 'web') return true;
        
        try {
            // Intentar obtener la posición actual con configuración permisiva
            await Geolocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 2000,
                maximumAge: 60000 // Aceptar posiciones cacheadas hasta 1 minuto
            });
            return true;
        } catch (e: any) {

            // Códigos de error:
            // 1 = PERMISSION_DENIED
            // 2 = POSITION_UNAVAILABLE (GPS apagado)
            // 3 = TIMEOUT
            
            // Si el error indica que el servicio no está habilitado
            const serviceDisabled = 
                e.code === 2 || 
                e.message?.toLowerCase().includes('not enabled') ||
                e.message?.toLowerCase().includes('location services');
                
            if (serviceDisabled) {
                return false;
            }
            
            // Si es timeout u otro error, asumimos que el servicio está activo
            // pero hubo un problema temporal
            return e.code === 3;
        }
    }


    // ... existing math/simulation code ... 
    calcDistanciaEnMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // --------------------------------------------------------
    // MOVEMENT & WATCHING
    // --------------------------------------------------------

    async startWatchingPosition() {
        if (this.watchId) return;

        this.watchId = await Geolocation.watchPosition(
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            },
            (position, err) => {
                if (position) {
                    this.currentPosition.set(position);
                } else if (err) {

                }
            }
        );
    }

    async stopWatchingPosition() {
        if (this.watchId) {
            await Geolocation.clearWatch({ id: this.watchId });
            this.watchId = null;
        }
    }

    // --------------------------------------------------------
    // SIMULATION (Development)
    // --------------------------------------------------------

    private simulationInterval: any = null;
    private simCurrentStep = 0;
    private simRoute: { lat: number, lng: number }[] = [];

    startSimulation(commerceLat: number, commerceLng: number, clientLat: number, clientLng: number) {
        if (!environment.production) {

            this.simulationEnabled = true;
            this.simCurrentStep = 0;

            const startLat = commerceLat + 0.0027;
            const startLng = commerceLng + 0.0027;

            this.simRoute = [];

            // Phase 1 (to commerce)
            for (let i = 0; i <= 20; i++) {
                const p = i / 20;
                this.simRoute.push({
                    lat: startLat + (commerceLat - startLat) * p,
                    lng: startLng + (commerceLng - startLng) * p
                });
            }
            // Phase 2 (wait)
            for (let i = 0; i < 5; i++) this.simRoute.push({ lat: commerceLat, lng: commerceLng });
            // Phase 3 (to client)
            for (let i = 1; i <= 30; i++) {
                const p = i / 30;
                this.simRoute.push({
                    lat: commerceLat + (clientLat - commerceLat) * p,
                    lng: commerceLng + (clientLng - commerceLng) * p
                });
            }

            this.simulationInterval = setInterval(() => {
                if (this.simCurrentStep < this.simRoute.length) {
                    const pt = this.simRoute[this.simCurrentStep];
                    this.currentPosition.set({
                        timestamp: Date.now(),
                        coords: {
                            latitude: pt.lat, longitude: pt.lng, accuracy: 10,
                            altitude: null, altitudeAccuracy: null, heading: null, speed: null
                        }
                    });
                    this.simCurrentStep++;
                } else {
                    this.stopSimulation();
                }
            }, 2000);
        }
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.simulationEnabled = false;
        this.simCurrentStep = 0;
        this.simRoute = [];
    }

    isSimulationActive(): boolean {
        return this.simulationEnabled;
    }
}
