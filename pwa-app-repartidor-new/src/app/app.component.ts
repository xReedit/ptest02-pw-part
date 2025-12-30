import { Component, OnInit, NgZone, ChangeDetectorRef, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { GeolocationService } from './core/services/geolocation.service';
import { AuthService } from './core/services/auth.service';
import { UiService } from './core/services/ui.service';
import { PermissionModalComponent } from './components/permission-modal/permission-modal.component';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Location, CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PermissionModalComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  showPermissionModal = false;

  constructor(
    private notificationService: NotificationService,
    private geoService: GeolocationService,
    private authService: AuthService,
    private uiService: UiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {
    // Reactively check permissions when Auth state changes
    effect(() => {
      const isAuth = this.authService.isAuthenticated();

      if (isAuth) {
        // User is logged in, check permissions
        this.requestAppPermissions();
      } else {
        // User is NOT logged in, hide modal regardless of permission status
        this.ngZone.run(() => {
          this.showPermissionModal = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  async ngOnInit() {

    // App State Change Listener (Native)
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && this.authService.isAuthenticated()) {

          this.requestAppPermissions();
        }
      });

      App.addListener('backButton', (data) => {
        this.ngZone.run(() => {
          if (this.uiService.handleBack()) return;
          const url = this.router.url;
          if (url === '/home' || url === '/login' || url === '/') {
            // Block exit on root pages
          } else {
            this.location.back();
          }
        });
      });
    }

    // Initial check (non-blocking)
    this.initApp();
  }

  async initApp() {
    try {
      // 1. Recover Session
      await this.authService.init();

      // 2. StatusBar (Native Only)
      if (Capacitor.isNativePlatform()) {
        try { await StatusBar.setOverlaysWebView({ overlay: false }); } catch (e) { }
      }

      // 3. Initial Permission Check happens automatically via 'effect' 
      // if the user turns out to be already authenticated.

    } catch (error) {

    }
  }

  async requestAppPermissions() {
    // Guard: Only check permissions if authenticated
    if (!this.authService.isAuthenticated()) {

      return;
    }

    try {
      const geoStatus = await this.geoService.getPermissionStatus();
      const notifStatus = await this.notificationService.getPermissionStatus();

      this.ngZone.run(() => {
        // Only show modal if a permission is missing OR GPS hardware is OFF
        if (geoStatus !== 'granted' || notifStatus !== 'granted') {

          this.showPermissionModal = true;
        } else {

          this.showPermissionModal = false;
          this.notificationService.init();
        }
        this.cdr.detectChanges();
      });
    } catch (error) {

      this.ngZone.run(() => {
        this.showPermissionModal = true;
        this.cdr.detectChanges();
      });
    }
  }

  onPermissionsGranted() {

    this.ngZone.run(() => {
      this.showPermissionModal = false;
      this.notificationService.init();
      this.cdr.detectChanges();
    });
  }
}
