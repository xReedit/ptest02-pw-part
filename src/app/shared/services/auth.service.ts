import { Injectable } from '@angular/core';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';
import { CrudHttpService } from './crud-http.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isLoggedStatus = false;

    constructor(private crudService: CrudHttpService) {

    }

    setLoggedStatus(value: boolean) {
        this.isLoggedStatus = value;
    }

    // verfica la existencia del token
    getLoggedStatus() {
        const token = localStorage.getItem('::token');
        const rpt = !!token ? true : false;
        this.isLoggedStatus = rpt;
        return rpt;
    }

    getUserLogged(usuario: UsuarioAutorizadoModel) {
        return this.crudService.loginUsuarioAutorizado(usuario);
    }

    setLocalToken(token: string) {
        localStorage.setItem('::token', token); // esto se modifica
        localStorage.setItem('::token-auth', token); // este se mantiene
        // guardo tambien la hora que esta iniciando session
        const ms_tieme_init_session = new Date().getTime();
        localStorage.setItem('sys::numtis', ms_tieme_init_session.toString());
    }

    getLocalToken() {
        return localStorage.getItem('::token');
    }

    setLocalUsuario(usuario: UsuarioAutorizadoModel) {
        localStorage.setItem('::us', JSON.stringify(usuario));
    }

    verifyToken() {
        return this.crudService.verificarToken();
    }

    loggedOutUser() {
        localStorage.removeItem('::token');
        localStorage.removeItem('::us');
        // localStorage.clear();
        this.setLoggedStatus(false);
    }

}
