import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
// import { RepartidorService } from './repartidor.service';


@Injectable()
export class HttpConfigInterceptorService implements HttpInterceptor {

  constructor(
    private authService: AuthService
    , private router: Router
    // , private crudService: CrudHttpService
    // , private repartidorService: RepartidorService
    ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((err, caught: Observable<HttpEvent<any>>) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            // si es error 401 de autentificacion es decir token caducadado
            // lo refresquea
            // manda a loguearse nuevamente
            // this.crudService.refreshToken().subscribe(res => {
            //   this.authService.setLocalToken(res.token);
            //   this.authService.setLoggedStatus(true);
            // });
            // this.repartidorService.cerrarSession();
            localStorage.clear();
            this.router.navigate(['../']);
          }
          throw err;
        })
      );
  }
}
