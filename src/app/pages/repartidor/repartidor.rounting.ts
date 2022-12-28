import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { IndicacionesPedidoComponent } from './indicaciones-pedido/indicaciones-pedido.component';
import { PedidoDetalleComponent } from './pedido-detalle/pedido-detalle.component';
import { PedidosAtendidosComponent } from './pedidos-atendidos/pedidos-atendidos.component';
import { MapaPedidosComponent } from './mapa-pedidos/mapa-pedidos.component';
import { ListGrupoPedidosComponent } from './list-grupo-pedidos/list-grupo-pedidos.component';
import { IndicacionesGrupoMapaComponent } from './indicaciones-grupo-mapa/indicaciones-grupo-mapa.component';

const routes: Routes = [{
    path: '', component: MainComponent,
    data: { titulo: 'Inicio' },
    children: [
        // {
        //     path: '', redirectTo: 'pedidos'
        // },
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
        },
        {
            path: 'pedidos-atendidos',
            component: PedidosAtendidosComponent,
            data: { titulo: 'Pedidos Atendidos' }
        },
        {
            path: 'mapa-de-pedidos',
            component: MapaPedidosComponent,
            data: { titulo: 'Mapa de pedidos' }
        },
        {
            path: 'list-grupo-pedidos',
            component: ListGrupoPedidosComponent,
            data: { titulo: 'Grupo de pedidos' }
        },
        {
            path: 'indicaciones-mapa-grupo',
            component: IndicacionesGrupoMapaComponent,
            data: { titulo: 'Indicaciones en el mapa' }
        }

    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RepartidorRoutingModule { }
