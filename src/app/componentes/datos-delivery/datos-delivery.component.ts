import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-datos-delivery',
  templateUrl: './datos-delivery.component.html',
  styleUrls: ['./datos-delivery.component.css']
})
export class DatosDeliveryComponent implements OnInit {
  @Output() public changeStatus = new EventEmitter<any>();

  myForm: FormGroup;
  loadConsulta = false;
  isNuevoCliente = false; // si es nuevo cliente manda a guardar

  constructor(
    private fb: FormBuilder,
    private crudService: CrudHttpService
    ) { }

  ngOnInit() {
    this.myForm = this.fb.group({
      idcliente: new FormControl('', [Validators.required]),
      dni: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      f_nac: new FormControl(''),
      direccion: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      paga_con: new FormControl('', [Validators.required]),
      dato_adicional: new FormControl('')
    });

    this.myForm.statusChanges.subscribe(res => {
      const isValid = res === 'VALID' ? true : false;
      const dataEmit = {
        formIsValid: isValid,
        isNuevoCliente: this.isNuevoCliente,
        formData: this.myForm.value
      };

      this.changeStatus.emit(dataEmit);
      // console.log('form delivery', dataEmit);
    });
  }

  buscarDNI(): void {
    const datos = {
      documento : this.myForm.controls.dni.value
    };

    this.loadConsulta = true;
    this.isNuevoCliente = false;
    this.limpiarForm(datos.documento);

    // primero consultamos en la bd
    this.crudService.postFree(datos, 'service', 'consulta-dni-ruc')
    .subscribe((res: any) => {
      // console.log(res);
      const _datosBd = res.data;
      if ( res.success && _datosBd.length > 0 ) {
        this.myForm.controls.idcliente.patchValue(_datosBd[0].idcliente);
        this.myForm.controls.nombre.patchValue(_datosBd[0].nombres);
        this.myForm.controls.f_nac.patchValue(_datosBd[0].f_nac);
        this.myForm.controls.direccion.patchValue(_datosBd[0].direccion);
        this.myForm.controls.telefono.patchValue(_datosBd[0].telefono);
        this.loadConsulta = false;
        this.isNuevoCliente = false;
      } else {

        this.crudService.getConsultaRucDni('dni', datos.documento)
        .subscribe((_res: any) => {
          if (_res.success) {
            const _datos = _res.data;
            const _nombre = `${_datos.names} ${_datos.first_name} ${_datos.last_name}`;
            this.myForm.controls.idcliente.patchValue(0);
            this.myForm.controls.nombre.patchValue(_nombre);
            this.myForm.controls.f_nac.patchValue(_datos.date_of_birthday);
            this.isNuevoCliente = true;
          } else {
            this.limpiarForm(datos.documento);
          }
          this.loadConsulta = false;
        });

      }
    });

  }

  private limpiarForm(dni: string): void {
    this.myForm.reset();
    this.myForm.controls.dni.patchValue(dni);
  }

}
