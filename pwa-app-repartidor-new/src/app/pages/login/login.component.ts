import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      nomusuario: ['', Validators.required],
      pass: ['', Validators.required],
      remember: [false]
    });
  }

  async ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setBackgroundColor({ color: '#008f3f' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (error) {

      }
    }

    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {

      this.router.navigate(['/home']);
      return;
    }

    // Cargar credenciales guardadas si existen
    const savedCreds = await this.storageService.get('saved_credentials');
    if (savedCreds) {
      this.loginForm.patchValue({
        nomusuario: savedCreds.nomusuario,
        pass: savedCreds.pass,
        remember: true
      });
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const { nomusuario, pass, remember } = this.loginForm.value;

    // Manejar "Recordar credenciales"
    if (remember) {
      await this.storageService.set('saved_credentials', { nomusuario, pass });
    } else {
      await this.storageService.remove('saved_credentials');
    }

    this.authService.login({ nomusuario, pass }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Usuario o contraseña incorrectos';

      }
    });
  }
}
