import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepartidorRoutingModule } from './repartidor.rounting';

import { MainComponent } from './main/main.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { IndicacionesPedidoComponent } from './indicaciones-pedido/indicaciones-pedido.component';
import { MaterialModule } from 'src/app/core/material/material.module';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';
// import { DialogEfectivoRepartidorComponent } from 'src/app/componentes/dialog-efectivo-repartidor/dialog-efectivo-repartidor.component';
import { PedidoDetalleComponent } from './pedido-detalle/pedido-detalle.component';
import { PedidosAtendidosComponent } from './pedidos-atendidos/pedidos-atendidos.component';
import { MapaPedidosComponent } from './mapa-pedidos/mapa-pedidos.component';



@NgModule({
  declarations: [
    MainComponent,
    PedidosComponent,
    IndicacionesPedidoComponent,
    PedidoDetalleComponent,
    PedidosAtendidosComponent,
    MapaPedidosComponent],
  imports: [
    CommonModule,
    RepartidorRoutingModule,
    CoreModule,
    ComponentesModule,
    MaterialModule,
  ],
  // entryComponents: [
  //   DialogEfectivoRepartidorComponent
  // ]
})
export class RepartidorModule { }
