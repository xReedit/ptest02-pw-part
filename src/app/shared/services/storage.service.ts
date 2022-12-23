import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';

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

  async setLoginUser(user: UsuarioAutorizadoModel) {
    await Preferences.set({
      key: 'sessionTokenUser',
      value: JSON.stringify(user)
    });
  }

  async getLoginUser() {    
    const { value } = await Preferences.get({ key: 'sessionTokenUser' });
    return value ? JSON.parse(value) : false;
  }

  async clearLoginUser() {    
    Preferences.remove({ key: 'sessionTokenUser' });
  }


}
