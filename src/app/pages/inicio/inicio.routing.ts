import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { LoginPersonalAutorizadoComponent } from './login-personal-autorizado/login-personal-autorizado.component';
import { LectorCodigoQrComponent } from './lector-codigo-qr/lector-codigo-qr.component';
import { LectorSuccessComponent } from './lector-success/lector-success.component';
import { CallbackAuthComponent } from './callback-auth/callback-auth.component';
import { CodigoQrGuard } from 'src/app/shared/guards/codigo-qr.guard';
import { LoginClienteComponent } from './login-cliente/login-cliente.component';
import { SeleccionarUbicacionDeliveryComponent } from './seleccionar-ubicacion-delivery/seleccionar-ubicacion-delivery.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'inicio'
        },
        {
            path: 'inicio',
            component: InicioComponent,
            data: { titulo: 'Inicio' }
        },
        {
            path: 'login-personal-autorizado',
            component: LoginPersonalAutorizadoComponent,
            data: { titulo: 'Login Personal Autorizado' }
        },
        {
            path: 'lector-qr',
            component: LectorCodigoQrComponent,
            data: { titulo: 'Lector QR' }
        },
        {
            path: 'lector-success',
            component: LectorSuccessComponent,
            canActivate: [CodigoQrGuard],
            data: { titulo: 'Lector QR' }
        },
        {
            path: 'login-client',
            component: LoginClienteComponent,
            canActivate: [CodigoQrGuard],
            data: { titulo: 'Loguear' }
        },
        {
            path: 'callback-auth',
            canActivate: [CodigoQrGuard],
            component: CallbackAuthComponent,
            data: { titulo: 'Callback Auth' }
        }

        // delivery
        ,
        {
            path: 'direccion-delivery',
            // canActivate: [CodigoQrGuard],
            component: SeleccionarUbicacionDeliveryComponent,
            data: { titulo: 'Seleccionar Direccion' }
        }

    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InicioRoutingModule { }
