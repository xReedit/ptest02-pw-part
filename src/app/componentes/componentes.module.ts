import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { GoogleMapsModule } from '@angular/google-maps';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

// import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';
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
import { CompPedidoDetalleComponent } from './comp-pedido-detalle/comp-pedido-detalle.component';
import { DialogImgItemComponent } from './dialog-img-item/dialog-img-item.component';
import { CompCalificacionComponent } from './comp-calificacion/comp-calificacion.component';
import { DialogCalificacionComponent } from './dialog-calificacion/dialog-calificacion.component';

// import { StarRatingModule } from 'angular-star-rating';
import { MapaOrdenesComponent } from './mapa-ordenes/mapa-ordenes.component';
import { CompOrdenDetalleComponent } from './comp-orden-detalle/comp-orden-detalle.component';
import { ComResumenPedidoComponent } from './com-resumen-pedido/com-resumen-pedido.component';
import { DialogOrdenDetalleComponent } from './dialog-orden-detalle/dialog-orden-detalle.component';
import { DialogChangePassComponent } from './dialog-change-pass/dialog-change-pass.component';
import { ScanCodePedidoComponent } from './scan-code-pedido/scan-code-pedido.component';
import { ItemPedidoExpressComponent } from './item-pedido-express/item-pedido-express.component';
// import { DialogSelectDireccionComponent } from './dialog-select-direccion/dialog-select-direccion.component';

@NgModule({
  declarations: [
    DatosDeliveryComponent,
    // DebounceClickDirective,
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
    CompPedidoDetalleComponent,
    DialogImgItemComponent,
    CompCalificacionComponent,
    DialogCalificacionComponent,
    MapaOrdenesComponent,
    CompOrdenDetalleComponent,
    ComResumenPedidoComponent,
    DialogOrdenDetalleComponent,
    DialogChangePassComponent,
    ScanCodePedidoComponent,
    ItemPedidoExpressComponent    
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    GoogleMapsModule,
    ZXingScannerModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo',
      libraries: ['places']
    })
    // StarRatingModule.forRoot()
  ],
  exports: [
    DatosDeliveryComponent,
    // DebounceClickDirective,
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
    MapaSoloComponent,
    CompPedidoDetalleComponent,
    DialogImgItemComponent,
    CompCalificacionComponent,
    DialogCalificacionComponent,
    MapaOrdenesComponent,
    CompOrdenDetalleComponent,
    ScanCodePedidoComponent,
    ItemPedidoExpressComponent    
  ],

  // entryComponents: [
  //   DialogMetodoPagoComponent,
  //   DialogVerificarTelefonoComponent,
  //   DialogDesicionComponent,
  //   DialogImgItemComponent,
  //   DialogCalificacionComponent
  // ]
})
export class ComponentesModule { }
