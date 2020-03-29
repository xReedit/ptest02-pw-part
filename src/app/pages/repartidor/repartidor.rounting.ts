import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { IndicacionesPedidoComponent } from './indicaciones-pedido/indicaciones-pedido.component';
import { PedidoDetalleComponent } from './pedido-detalle/pedido-detalle.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'pedidos'
        },
        {
            path: 'pedidos',
            component: PedidosComponent,
            data: { titulo: 'Pedido' }
        },
        {
            path: 'indicaciones',
            component: IndicacionesPedidoComponent,
            data: { titulo: 'Indicaciones Pedido' }
        },
        {
            path: 'pedido-detalle',
            component: PedidoDetalleComponent,
            data: { titulo: 'Indicaciones Pedido' }
        }

    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RepartidorRoutingModule { }
