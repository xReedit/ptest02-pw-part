import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class HttpService {
    private apiUrl = environment.urlServer;
    private storage = inject(StorageService);

    constructor(private http: HttpClient) { }

    private async getHeaders(includeAuth: boolean = true): Promise<HttpHeaders> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        if (includeAuth) {
            // Get token directly from storage (avoid circular dependency with AuthService)
            // Use ::token which is always saved by AuthService
            const token = await this.storage.get('::token');
            if (token) {
                headers = headers.set('Authorization', token);
            }
        }

        return headers;
    }

    get<T>(endpoint: string, params?: any, includeAuth: boolean = true): Observable<T> {
        return from(this.getHeaders(includeAuth)).pipe(
            switchMap(headers => {
                let httpParams = new HttpParams();
                if (params) {
                    Object.keys(params).forEach(key => {
                        if (params[key] !== null && params[key] !== undefined) {
                            httpParams = httpParams.set(key, params[key]);
                        }
                    });
                }
                return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers, params: httpParams });
            })
        );
    }

    post<T>(endpoint: string, body: any, includeAuth: boolean = true): Observable<T> {
        return from(this.getHeaders(includeAuth)).pipe(
            switchMap(headers => {
                return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
            })
        );
    }

    put<T>(endpoint: string, body: any, includeAuth: boolean = true): Observable<T> {
        return from(this.getHeaders(includeAuth)).pipe(
            switchMap(headers => {
                return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
            })
        );
    }

    delete<T>(endpoint: string, includeAuth: boolean = true): Observable<T> {
        return from(this.getHeaders(includeAuth)).pipe(
            switchMap(headers => {
                return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers });
            })
        );
    }
}
