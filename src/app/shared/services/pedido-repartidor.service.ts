import { Injectable } from '@angular/core';
import { PedidoRepartidorModel } from 'src/app/modelos/pedido.repartidor.model';
import { CrudHttpService } from './crud-http.service';

@Injectable({
  providedIn: 'root'
})
export class PedidoRepartidorService {
  pedidoRepartidor: PedidoRepartidorModel;
  keyLocal = 'sys::pr';

  constructor(
    private crudService: CrudHttpService
  ) {
    this.init();
  }

  init() {
    this.pedidoRepartidor = this.getLocal();
  }


  setPasoVa(val: number) {
    this.pedidoRepartidor.paso_va = val;
    this.setLocal();
  }

  setLocal(obj: PedidoRepartidorModel = this.pedidoRepartidor) {
    localStorage.setItem(this.keyLocal, btoa(JSON.stringify(obj)));
  }

  getLocal(): PedidoRepartidorModel {
    const rpt = localStorage.getItem(this.keyLocal);
    return rpt ? JSON.parse(atob(rpt)) : new PedidoRepartidorModel;
  }

  asignarPedido(): void {
    const _data = {
      idpedido: this.pedidoRepartidor.idpedido
    };

    this.crudService.postFree(_data, 'repartidor', 'set-asignar-pedido', true)
      .subscribe(res => {
        this.pedidoRepartidor.estado = 1; // asignadp
        this.setPasoVa(1);
      });
  }
}
