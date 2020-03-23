import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EncuestaComponent } from './encuesta/encuesta.component';

const routes: Routes = [{
    path: '', component: EncuestaComponent,
    data: { titulo: 'Inicio' },
    children: [
        {
            path: '', redirectTo: 'inicio'
        }
    ]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EncuestaRoutingModule { }
