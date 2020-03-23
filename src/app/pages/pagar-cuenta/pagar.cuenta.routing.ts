import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';
import { PagoRespuestaComponent } from './pago-respuesta/pago-respuesta.component';

const routes: Routes = [{
    path: '', component: PagarCuentaComponent,
    data: { titulo: 'Cuenta' },
    children: [
        {
            path: '', redirectTo: 'pagar-cuenta'
        }, {
            path: 'pago-res',
            component: PagoRespuestaComponent
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagarCuentaRoutingModule { }
