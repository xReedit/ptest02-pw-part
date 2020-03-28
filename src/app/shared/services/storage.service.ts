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

  setBtoa(key: string, data: string) {
    localStorage.setItem(key, btoa(data));
  }

  getAtob(key: string, isJson = false) {
    const _rpt = atob(localStorage.getItem(key));
    return isJson ? JSON.parse(_rpt) : _rpt;
  }

  isExistKey(key: string): boolean {
    return localStorage.getItem(key) ? true : false;
  }

  clear(key: string) {
    localStorage.removeItem(key);
  }


}
