import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_SERVER } from '../config/config.const';
import { CrudHttpService } from './crud-http.service';
import { TransitiveCompileNgModuleMetadata } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private  urlService = URL_SERVER;
  constructor(private _zone: NgZone, private curdService: CrudHttpService) {}
  getServerSentEvent(controller: string, evento: string, conToken: boolean = false, id = 0): Observable<any> {
    return Observable.create(observer => {
      console.log('servicio sse');
      const eventSource = this.getEventSource(controller, evento, conToken, id);
      eventSource.onmessage = (event: any) => {
        this._zone.run(() => {
          observer.next(event.data);
        });
      };
      eventSource.onerror = error => {
        this._zone.run(() => {
          observer.error(error);
        });
      };
    });
  }
  private getEventSource(controller: string, evento: string, conToken: boolean = true, id = 0): EventSource {
    const url = `${this.urlService}/${controller}/${evento}?id=${id}`;
    console.log('url', url);
    // const header = conToken ? this.curdService.getHeaderHttpClientForm() : this.curdService.getHeaderHttpClientFormNoToken();
    return new EventSource(url);
  }

}
