import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';
import { EncuestaOpcionComponent } from './encuesta-opcion/encuesta-opcion.component';
// import { DialogUbicacionComponent } from './dialog-ubicacion/dialog-ubicacion.component';
import { AgregarDireccionComponent } from './agregar-direccion/agregar-direccion.component';

import { AgmCoreModule } from '@agm/core';
import { ItemComercioComponent } from './item-comercio/item-comercio.component';
import { SeleccionarDireccionComponent } from './seleccionar-direccion/seleccionar-direccion.component';
import { ConfirmarDeliveryComponent } from './confirmar-delivery/confirmar-delivery.component';
import { MenuLateralClienteComponent } from './menu-lateral-cliente/menu-lateral-cliente.component';
import { DialogMetodoPagoComponent } from './dialog-metodo-pago/dialog-metodo-pago.component';
import { DialogVerificarTelefonoComponent } from './dialog-verificar-telefono/dialog-verificar-telefono.component';
import { DialogDesicionComponent } from './dialog-desicion/dialog-desicion.component';
import { DialogEfectivoRepartidorComponent } from './dialog-efectivo-repartidor/dialog-efectivo-repartidor.component';
import { ProgressTimeLimitComponent } from './progress-time-limit/progress-time-limit.component';
import { ItemPedidoComponent } from './item-pedido/item-pedido.component';
import { MapaSoloComponent } from './mapa-solo/mapa-solo.component';
// import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';

@NgModule({
  declarations: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    AgregarDireccionComponent,
    ItemComercioComponent,
    SeleccionarDireccionComponent,
    ConfirmarDeliveryComponent,
    MenuLateralClienteComponent,
    DialogMetodoPagoComponent,
    DialogVerificarTelefonoComponent,
    DialogDesicionComponent,
    DialogDesicionComponent,
    DialogEfectivoRepartidorComponent,
    ProgressTimeLimitComponent,
    ItemPedidoComponent,
    MapaSoloComponent,
    // DialogSelectDireccionComponent,
    // DialogUbicacionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo',
      libraries: ['places']
    })
  ],
  exports: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    AgregarDireccionComponent,
    ItemComercioComponent,
    SeleccionarDireccionComponent,
    ConfirmarDeliveryComponent,
    DialogMetodoPagoComponent,
    DialogVerificarTelefonoComponent,
    DialogDesicionComponent,
    DialogEfectivoRepartidorComponent,
    ProgressTimeLimitComponent,
    ItemPedidoComponent,
    MapaSoloComponent
  ],

  entryComponents: [
    DialogMetodoPagoComponent,
    DialogVerificarTelefonoComponent,
    DialogDesicionComponent,
  ]
})
export class ComponentesModule { }
