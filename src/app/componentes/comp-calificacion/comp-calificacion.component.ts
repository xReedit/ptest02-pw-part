import { Component, OnInit, Input } from '@angular/core';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-comp-calificacion',
  templateUrl: './comp-calificacion.component.html',
  styleUrls: ['./comp-calificacion.component.css']
})
export class CompCalificacionComponent implements OnInit {
  countFin = 2;
  private intervalConteo = null;
  @Input() dataCalificado: DatosCalificadoModel;

  constructor(
    private crudService: CrudHttpService
  ) { }

  ngOnInit() {
  }

  onRatingChange($event: any) {
    console.log('calificacion', $event);
    this.dataCalificado.calificacion =  $event.rating;
    if ( this.dataCalificado.showMsjTankyou ) {
      this.countFin = 2;
      this.cuentaRegresivaCalificacion();
    }
  }

  // despues que califica cuenta 2 segundo para guardar
  private cuentaRegresivaCalificacion() {
    if ( this.countFin <= 0 ) {
      this.intervalConteo = null;
      this.guardarCalificacion();
    } else {
      this.conteoFinEncuesta();
    }
  }

  private conteoFinEncuesta(): void {
    this.intervalConteo =  setTimeout(() => {
      this.countFin --;
      this.cuentaRegresivaCalificacion();
    }, 1000);
  }

  private guardarCalificacion() {
    const _data = {
      dataCalificacion : this.dataCalificado
    };

    this.crudService.postFree(_data, 'delivery', 'calificar-servicio', false)
      .subscribe(res => console.log(res));
  }


}
