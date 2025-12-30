import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    // Usamos una señal para que sea reactivo y fácil de inspeccionar
    private _backHandler = signal<(() => boolean) | null>(null);

    /**
     * Registra un manejador para el botón de atrás.
     */
    setBackHandler(handler: (() => boolean) | null) {

        this._backHandler.set(handler);
    }

    /**
     * Intenta manejar el botón de atrás con el handler registrado.
     */
    handleBack(): boolean {
        const handler = this._backHandler();
        if (handler) {
            return handler();
        }
        return false;
    }
}
