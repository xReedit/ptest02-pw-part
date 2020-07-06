import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { InicioRepartidorRoutingModule } from './inicio-repartidor.routing';
import { CoreModule } from 'src/app/core/core.module';



@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    InicioRepartidorRoutingModule,
    CoreModule
  ]
})
export class InicioRepartidorModule { }
