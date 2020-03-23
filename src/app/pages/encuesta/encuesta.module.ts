import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncuestaRoutingModule } from './encuesta.routing';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ComponentesModule } from 'src/app/componentes/componentes.module';
import { EncuestaComponent } from './encuesta/encuesta.component';



@NgModule({
  declarations: [
    EncuestaComponent
  ],
  imports: [
    CommonModule,
    EncuestaRoutingModule,
    MaterialModule,
    ComponentesModule
  ]
})
export class EncuestaModule { }
