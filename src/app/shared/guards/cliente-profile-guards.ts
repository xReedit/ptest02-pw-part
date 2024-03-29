import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { VerifyAuthClientService } from '../services/verify-auth-client.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteProfileGuard implements CanActivate {
  constructor (
    private verifyClientService: VerifyAuthClientService
  ) {}
  // canActivate(
  //   next: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //   return true;
  // }

  canActivate() {
    // console.log('canActivate', this.verifyClientService.getIsQrSuccess());
    return this.verifyClientService.isLogin() || this.verifyClientService.getIsLoginByDNI();
  }

}
