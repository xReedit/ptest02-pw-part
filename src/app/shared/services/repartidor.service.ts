import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';

@Injectable({
  providedIn: 'root'
})
export class RepartidorService {

  constructor(
    private crudService: CrudHttpService
  ) { }

  // guarda efectivo inicial
  guardarEfectivo(importe: number) {
    const _data = {
      efectivo: importe,
      online: 1
    };

    this.crudService.postFree(_data, 'repartidor', 'set-efectivo-mano', true)
      .subscribe(res => {
      });
  }

  guardarPositionActual(_pos: GeoPositionModel) {
    const _data = {
      pos: _pos
    };

    this.crudService.postFree(_data, 'repartidor', 'set-position-now', true)
      .subscribe(res => {
      });

  }
}
