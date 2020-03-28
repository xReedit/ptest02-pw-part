import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutMainComponent } from './core/layout-main/layout-main.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { ClienteProfileGuard } from './shared/guards/cliente-profile-guards';

const routes: Routes = [
  // { path: '', redirectTo: '', pathMatch: 'full' },
  // {
  // path: '',
  // component: LayoutMainComponent,
  // children: [
    {
      path: '',
      loadChildren: () => import('./pages/inicio/inicio.module').then(m => m.InicioModule),
      data: { 'tituloModulo': 'Inicio' }
    },
    {
      path: 'repartidor',
      loadChildren: () => import('./pages/repartidor/repartidor.module').then(m => m.RepartidorModule),
      canActivate: [AuthGuard],
      data: { 'tituloModulo': 'Repartidor' }
    }
    // ,
    // {
    //   path: 'lanzar-encuesta',
    //   loadChildren: () => import('./pages/encuesta/encuesta.module').then(m => m.EncuestaModule),
    //   canActivate: [AuthGuard],
    //   data: { 'tituloModulo': 'Encuesta' }
    // },
    // {
    //   path: 'pagar-cuenta',
    //   loadChildren: () => import('./pages/pagar-cuenta/pagar-cuenta.module').then(m => m.PagarCuentaModule),
    //   canActivate: [AuthGuard],
    //   data: { 'tituloModulo': 'Cuenta' }
    // },
    // {
    //   path: 'cliente-profile',
    //   loadChildren: () => import('./pages/cliente-profile/cliente-profile.module').then(m => m.ClienteProfileModule),
    //   canActivate: [ClienteProfileGuard],
    //   data: { 'tituloModulo': 'Cliente Profile' }
    // },
    // {
    //   path: 'zona-delivery',
    //   loadChildren: () => import('./pages/zona-establecimientos/zona-establecimientos.module').then(m => m.ZonaEstablecimientosModule),
    //   canActivate: [ClienteProfileGuard],
    //   data: { 'tituloModulo': 'Cliente Zona Delivery' }
    // }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes, {
      useHash: true,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      paramsInheritanceStrategy: 'always'
    }
    )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
