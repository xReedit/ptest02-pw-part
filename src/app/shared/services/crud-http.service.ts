import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { InfoTockenService } from './info-token.service';
import { URL_SERVER, URL_CONSULTA_RUC_DNI, TOKEN_CONSULTA, TOKEN_SMS } from '../config/config.const';
import { catchError } from 'rxjs/operators';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';


@Injectable()
export class CrudHttpService {

    constructor(
        private httpClient: HttpClient
        , private infoTockenService: InfoTockenService
    ) {

    }

    // conOrg, conSede FILTRAN SI NO SE ESPECIFICA POR ORG Y SEDE
    getAll(controller: string, evento: string, conOrg: boolean = true, conSede: boolean = true, token: boolean = true): Observable<any[]> {
        const url = this.setUrlFiltros(controller, evento, conOrg, conSede);
        const header = token ? this.getHeaderHttpClientForm() : null;

        return this.httpClient.get<any[]>(url, { headers: header });
    }

    getTimeNow(): Observable<any[]> {
        const url = this.setUrlFiltros('estadistica', 'getFechaNow', false, false);
        const header = null;
        return this.httpClient.get<any[]>(url, { headers: header });
    }

    // numeropagina: numero pagina a mostrar
    // rows: cantidad de filas o registros a mostrar
    // filter: filtros de busqueda para la paginacion // se adjunta a org y sede
    // orden: nombre del campo por el cual se ordenara
    // ordendireccion: default ASC
    paginacion(controller: string, evento: string,
        pagenumber: number, rows: number, filter: string,
        orden: string, ordendireccion: string = null,
        conOrg: boolean = true, conSede: boolean = true): Observable<any[]> {


        const url = this.setUrlFiltros(controller, evento, conOrg, conSede, filter);
        console.log('url', url);
        const params = new HttpParams({
            fromObject: {
                pagenumber: pagenumber.toString(),
                rows: rows.toString(),
                orden: orden,
                ordendireccion: ordendireccion || ''
            }
        });

        return this.httpClient.get<any[]>(url, { params: params });
    }

    // enviar idorg o idsede o idusuario vacios, el back end los llenara
    create(datos: any, controller: string, evento: string = 'create'): Observable<any> {
        const url = this.setUrl(controller, evento);
        const header = this.getHeaderHttpClientForm();

        return this.httpClient.post<any>(url, datos, { headers: header });
    }

    // enviar idorg o idsede o idusuario vacios, el back end los llenara
    update(datos: any, id: any, controller: string, evento: string = 'update'): Observable<any> {
        const url = this.setUrl(controller, evento) + '/' + id.toString();
        const header = this.getHeaderHttpClientForm();

        return this.httpClient.put<any>(url, datos, { headers: header });
    }

    // enviar idorg o idsede o idusuario vacios, el back end los llenara
    postFree(datos: any, controller: string, evento: string = 'update', conToken: boolean = true): Observable<any> {
        const url = this.setUrl(controller, evento);
        const header = conToken ? this.getHeaderHttpClientForm() : this.getHeaderHttpClientFormNoToken();

        return this.httpClient.post<any>(url, datos, { headers: header });
    }

    // enviar mensaje SMS de seguridad
    postSMS(datos: any, controller: string, evento: string , conTokenSMS: boolean = true): Observable<any> {
        const url = this.setUrl(controller, evento);
        const header = conTokenSMS ? this.getHeaderHttpClientFormSMS() : this.getHeaderHttpClientFormNoToken();

        return this.httpClient.post<any>(url, datos, { headers: header });
    }

    getFree(url: string): Observable<any> {
        return this.httpClient.get<any>(url);
    }

    // consulta ruc o dni
    getConsultaRucDni(controller: string, number: string): Observable<any> {
        const url =  `${URL_CONSULTA_RUC_DNI}${controller}/${number}`;
        const header = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${TOKEN_CONSULTA}`);

        return this.httpClient.get<any>(url, { headers: header });
    }

    getFilterBy(controller: string, evento: string,
        filter: string, conOrg: boolean = true, conSede: boolean = true): Observable<any[]> {

        const url = this.setUrlFiltros(controller, evento, conOrg, conSede, filter);
        return this.httpClient.get<any[]>(url);
    }

    getById(id: any, controller: string, evento: string): Observable<any[]> {
        const url = this.setUrlFiltros(controller, evento, false, false, id);
        return this.httpClient.get<any[]>(url);
    }


    // login manda los datos en json
    loginUsuarioAutorizado(datos: any): Observable<any> {
        const url = this.setUrl('login-usuario-autorizado-repartidor', '');
        const header = this.getHeaderHttpClientFormNoToken();

        return this.httpClient.post<any>(url, datos, { headers: header });
    }

    verificarToken(): Observable<any> {
        const url = this.setUrl('verificarToken', '');
        const header = this.getHeaderHttpClientForm();

        return this.httpClient.post<any>(url, { headers: header });
    }

    refreshToken() {
        const _jwt = this.infoTockenService.getInfoUs();
        const __jwt: any = !_jwt.pass ? _jwt.usuario : _jwt;

        const _data = {
            nomusuario: __jwt.usuario,
            pass: atob(__jwt.pass)
          };

        const url = this.setUrl('login-usuario-autorizado-repartidor', '');
        const header = this.getHeaderHttpClientFormNoToken();

        return this.httpClient.post<any>(url, _data , { headers: header });
    }




    private setUrl(controller: string, evento: string) {
        const url = `${URL_SERVER}/${controller}/${evento}`;
        return url;
    }

    private setUrlFiltros(controller: string, evento: string, conOrg: boolean, conSede: boolean, filter: string = ''): string {
        const getSede = conSede ? this.setInfoSedeToken() : '';
        const getOrg = conOrg ? this.setInfoOrgToken() : '';
        const getOperador = (conOrg && conSede) ? '~y~' : '';
        const filterOrgSede = `${getSede + getOperador + getOrg}`;
        let getFilter = filterOrgSede === '' ? filter : filter === '' ? '' : `~y~${filter}`;

        getFilter = '/' + filterOrgSede + getFilter;


        const url = `${URL_SERVER}/${controller}/${evento}${getFilter}`;
        return url;
    }

    private setInfoSedeToken(): string {
        return 'idsede:eq:' + this.infoTockenService.getInfoSedeToken();
    }
    private setInfoOrgToken(): string {
        return 'idorg:eq:' + this.infoTockenService.getInfoSedeToken();
    }

    private getHeaderHttpClientForm(): HttpHeaders {
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', this.infoTockenService.getTokenAuth());
        return headers;
    }

    private getHeaderHttpClientFormSMS(): HttpHeaders {
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', TOKEN_SMS);
        return headers;
    }

    private getHeaderHttpClientFormNoToken(): HttpHeaders {
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json');
        return headers;
    }

}
