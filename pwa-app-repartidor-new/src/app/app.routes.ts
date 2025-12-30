import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard]
    },
    {
        path: 'assign-order',
        loadComponent: () => import('./pages/assign-order/assign-order.component').then(m => m.AssignOrderComponent),
        canActivate: [authGuard]
    },
    {
        path: 'pending-orders-list',
        loadComponent: () => import('./pages/pending-orders-list/pending-orders-list.component').then(m => m.PendingOrdersListComponent),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
