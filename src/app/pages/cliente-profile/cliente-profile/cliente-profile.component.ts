import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';


@Component({
  selector: 'app-cliente-profile',
  templateUrl: './cliente-profile.component.html',
  styleUrls: ['./cliente-profile.component.css']
})
export class ClienteProfileComponent implements OnInit {
  infoAuth: SocketClientModel;
  dataCliente: any;

  registerForm: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private crudService: CrudHttpService,
    private verifyAuthService: VerifyAuthClientService,
    private utilService: UtilitariosService
  ) { }

  ngOnInit() {
    this.infoAuth = this.verifyAuthService.getDataClient();
    this.loadDatosCliente();
  }

  private loadFormCliente(): void {
    this.registerForm = this.formBuilder.group({
      nombres: [{value: '', disabled: this.dataCliente.nombres.length > 0}],
      ruc: [{value: '', disabled: this.dataCliente.ruc.length > 0}],
      email: [{value: '', disabled: this.dataCliente.email.length > 0}, [Validators.email]],
      f_nac: [{value: '', disabled: this.dataCliente.f_nac.toString().length > 0}],
    });
  }

  loadDatosCliente() {
    this.crudService.postFree(this.infoAuth, 'cliente', 'perfil', false).subscribe((res: any) => {
      if ( res.success ) {
        this.dataCliente = res.data[0];
        this.dataCliente.f_nac = new Date(this.dataCliente.f_nac);
        this.loadFormCliente();

        this.registerForm.controls['nombres'].patchValue(this.dataCliente.nombres);
        this.registerForm.controls['ruc'].patchValue(this.dataCliente.ruc);
        this.registerForm.controls['email'].patchValue(this.dataCliente.email);
        // this.registerForm.controls['f_nac'].patchValue(new Date(this.dataCliente.f_nac));
      }

      console.log(res);
    });
  }

  guardarDatosCliente(): void {
    let _valFNac = this.registerForm.controls['f_nac'].value;
    _valFNac = _valFNac === '' ? this.dataCliente.f_nac : this.utilService.reformatDate(_valFNac);
    const _fnac = _valFNac.length > 0 ? _valFNac : '';
    const _dataUs = {
      idcliente: this.infoAuth.idcliente,
      ruc: this.registerForm.controls['ruc'].value,
      email: this.registerForm.controls['email'].value,
      f_nac: _fnac,
    };

    console.log(_dataUs);


    this.crudService.postFree(_dataUs, 'cliente', 'perfil-save', false)
      .subscribe(res => {
        console.log(res);
      });

  }


  cerrarSession(): void {
    this.verifyAuthService.loginOut();
  }

}
