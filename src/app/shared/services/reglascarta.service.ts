import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { StorageService } from './storage.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ReglascartaService {
  objReglasCarta: any;
  private keyStorage = 'sys::rules';

  constructor(
    private storageService: StorageService,
    private socketService: SocketService
  ) { }

  loadReglasCarta() {

    // if ( this.storageService.isExistKey(this.keyStorage) ) {
    //   return this.decodeObjInSotrage();
    // } else {
    //   return this.dataReglasCarta();
    // }
    return this.dataReglasCarta();
  }

  getObjReglasCarta(): any {
    return this.objReglasCarta;
  }

  private dataReglasCarta() {
    return new Observable(observer => {
      this.socketService.onReglasCarta().subscribe((res: any) => {
        this.objReglasCarta = res[0];
        this.codeObjInSotrage();
        console.log(this.objReglasCarta);
        observer.next(this.objReglasCarta);
      });
    });
  }

  private codeObjInSotrage(): void {
    this.storageService.set(this.keyStorage, btoa(JSON.stringify(this.objReglasCarta)));
  }

  private decodeObjInSotrage() {
    return new Observable(observer => {
      const objFromStorage = this.storageService.get(this.keyStorage);
      try {
        this.objReglasCarta = JSON.parse(atob(objFromStorage));
        console.log(this.objReglasCarta);
        observer.next(this.objReglasCarta);
      } catch (error) {
        this.dataReglasCarta();
      }
    });
  }
}
