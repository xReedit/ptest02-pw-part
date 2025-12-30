import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Esperar a que el servicio esté inicializado (importante para F5)
    if (!authService.isReady()) {

        await firstValueFrom(
            toObservable(authService.isReady).pipe(
                filter(ready => ready),
                take(1)
            )
        );
    }

    if (authService.isAuthenticated()) {

        return true;
    }

    return router.parseUrl('/login');
};
