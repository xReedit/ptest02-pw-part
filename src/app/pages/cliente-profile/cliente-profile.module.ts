import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteProfileComponent } from './cliente-profile/cliente-profile.component';
import { ClienteProfileRoutingModule } from './cliente-profile.routing';
import { MaterialModule } from 'src/app/core/material/material.module';
import { ClienteComprobantesComponent } from './cliente-comprobantes/cliente-comprobantes.component';
import { ClienteHistorialComponent } from './cliente-historial/cliente-historial.component';
import { ClienteMainComponent } from './cliente-main/cliente-main.component';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    ClienteMainComponent,
    ClienteProfileComponent,
    ClienteComprobantesComponent,
    ClienteHistorialComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClienteProfileRoutingModule,
    MaterialModule,
  ]
})
export class ClienteProfileModule { }
