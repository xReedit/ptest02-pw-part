import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { ComponentesModule } from 'src/app/componentes/componentes.module';

import { MainComponent } from './main/main.component';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './carta/carta.component';
import { ResumenPedidoComponent } from './resumen-pedido/resumen-pedido.component';
import { EstadoPedidoComponent } from './estado-pedido/estado-pedido.component';
import { BuscarItemComponent } from './buscar-item/buscar-item.component';
import { PedidoRoutingModule } from './pedido.routing';
import { CoreModule } from 'src/app/core/core.module';

// import { DialogItemComponent } from './resumen-pedido/dialog-item/dialog-item.component';
import { BusquedaComponent } from './busqueda/busqueda.component';
// import { DialogSubitemRemoveComponent } from './resumen-pedido/dialog-subitem-remove/dialog-subitem-remove.component';

import { DialogResetComponent } from './resumen-pedido/dialog-reset/dialog-reset.component';
import { DialogLoadingComponent } from './resumen-pedido/dialog-loading/dialog-loading.component';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';
import { DialogVerificarTelefonoComponent } from 'src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component';
// import { DialogMetodoPagoComponent } from 'src/app/componentes/dialog-metodo-pago/dialog-metodo-pago.component';
// import { PagarCuentaComponent } from './pagar-cuenta/pagar-cuenta.component';



@NgModule({
  declarations: [
    MainComponent,
    InicioComponent,
    CartaComponent,
    ResumenPedidoComponent,
    EstadoPedidoComponent,
    BuscarItemComponent,
    // DialogItemComponent,
    DialogResetComponent,
    DialogLoadingComponent,
    // DialogSubitemRemoveComponent,
    DialogItemEditComponent,
    BusquedaComponent,
    // PagarCuentaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PedidoRoutingModule,
    CoreModule,
    ComponentesModule
  ],
  exports: [
    // DialogItemComponent,
    DialogResetComponent,
    DialogLoadingComponent,
    DialogItemEditComponent
  ],
  entryComponents: [
    DialogResetComponent,
    DialogLoadingComponent,
    DialogItemEditComponent,
    DialogVerificarTelefonoComponent
    // DialogMetodoPagoComponent
  ]
})
export class PedidoModule { }
