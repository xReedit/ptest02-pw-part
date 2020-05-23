import { Component, OnInit, Input } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-pedidos-atendidos',
  templateUrl: './pedidos-atendidos.component.html',
  styleUrls: ['./pedidos-atendidos.component.css']
})
export class PedidosAtendidosComponent implements OnInit {
  _tabIndex;

  @Input()
  public set tabIndex(val: number) {
    if ( val === 1) { // tab activo para este componente
      this.xLoadResumenPedidos();
    }
  }

  listResumen: any;
  listPedidosEntregados: any;

  importeNetoDebitar = 0;
  importeNetoDepositar = 0;


  constructor(
    private crudService: CrudHttpService
  ) { }

  ngOnInit() {

  }

  private xLoadPedidosAtendidos() {
    this.crudService.getAll('repartidor', 'get-pedidos-entregados-dia', false, false, true)
      .subscribe((res: any) => {
        this.listPedidosEntregados = res.data[0];
        // console.log(res);
      });
  }

  private xLoadResumenPedidos() {
    this.crudService.getAll('repartidor', 'get-pedidos-resumen-entregados-dia', false, false, true)
    .subscribe((res: any) => {
      this.listResumen = res.data[0][0];
      this.importeNetoDebitar = parseFloat(this.listResumen.importeDepositar) - parseFloat(this.listResumen.importeDebitar);
        this.importeNetoDepositar = this.importeNetoDebitar < 1 ? 0 : this.importeNetoDebitar;
        this.importeNetoDebitar = this.importeNetoDebitar < 1 ? this.importeNetoDebitar * -1 : 0;
      this.xLoadPedidosAtendidos();
      // console.log(res);
    });
  }

}
