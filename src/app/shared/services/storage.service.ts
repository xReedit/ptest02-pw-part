import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  set(key: string, data: string) {
    localStorage.setItem(key, data);
  }

  get(key: string) {
    return localStorage.getItem(key);
  }

  isExistKey(key: string): boolean {
    return localStorage.getItem(key) ? true : false;
  }

  clear(key: string) {
    localStorage.removeItem(key);
  }


}
