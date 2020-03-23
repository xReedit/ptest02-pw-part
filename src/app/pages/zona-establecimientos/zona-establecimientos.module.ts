import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { EstablecimientosComponent } from './establecimientos/establecimientos.component';
import { ZonaEstablecimientosRoutingModule } from './zona-establecimientos.routing';
import { CategoriasComponent } from './categorias/categorias.component';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { MisOrdenesComponent } from './mis-ordenes/mis-ordenes.component';



@NgModule({
  declarations: [
    MainComponent,
    EstablecimientosComponent,
    CategoriasComponent,
    MisOrdenesComponent,
    DialogSelectDireccionComponent,
  ],
  imports: [
    CommonModule,
    ZonaEstablecimientosRoutingModule,
    MaterialModule,
    ComponentesModule
  ],
  exports: [
    DialogSelectDireccionComponent
  ],
  entryComponents: [
    DialogSelectDireccionComponent
  ]
})
export class ZonaEstablecimientosModule { }
