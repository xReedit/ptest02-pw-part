import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClienteMainComponent } from './cliente-main/cliente-main.component';
import { ClienteProfileComponent } from './cliente-profile/cliente-profile.component';
import { ClienteComprobantesComponent } from './cliente-comprobantes/cliente-comprobantes.component';

const routes: Routes = [{
    path: '', component: ClienteMainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'inicio'
        },
        {
            path: 'inicio',
            component: ClienteProfileComponent,
            data: { titulo: 'Inicio' }
        },
        {
            path: 'comprobantes',
            component: ClienteComprobantesComponent,
            data: { titulo: 'Inicio' }
        },
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClienteProfileRoutingModule { }
