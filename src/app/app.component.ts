import { Component } from '@angular/core';
import { Auth0Service } from './shared/services/auth0.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // title = 'pwa-app-pedido';

  constructor(
    private auth: Auth0Service
  ) {}
}
