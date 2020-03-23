import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { Router } from '@angular/router';
// import { AuthService } from 'src/app/shared/services/auth.service';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialog } from '@angular/material/dialog';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  // rippleColor = 'rgb(255,238,88, 0.2)';

  listEstablecimientos: DeliveryEstablecimiento[];

  codigo_postal_actual: string;
  infoClient: SocketClientModel;
  isNullselectedDireccion = true;
  direccionCliente: DeliveryDireccionCliente;
  // private veryfyClient: Subscription = null;

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    // private authService: AuthService,
    // private infoToken: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    private dialogDireccion: MatDialog,
    private calcDistanceService: CalcDistanciaService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit() {
    // this.loadEstablecimientos();
    this.infoClient = this.verifyClientService.getDataClient();

    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        this.codigo_postal_actual = res.codigo || '0';
        this.isNullselectedDireccion = false;
        this.direccionCliente = res;
        this.infoClient.direccionEnvioSelected = this.direccionCliente;
        this.loadEstablecimientos();
      } else {

      }
    });
  }

  loadEstablecimientos() {
    const _data = {
      idsede_categoria: 1,
      codigo_postal: this.codigo_postal_actual
    };

    this.listEstablecimientos = [];
    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        // setTimeout(() => {
          this.listEstablecimientos = res.data;
          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            // this.calcDistancia(x);
            this.calcDistanceService.calculateRoute(this.direccionCliente, dirEstablecimiento);
            // dirEstablecimiento.c_servicio = _c_servicio;

          });
        // }, 500);
        // console.log(this.listEstablecimientos);
      });
  }


  // private calcDistancia(direccionEstablecimiento: DeliveryEstablecimiento) {
  //   this.calcDistanceService.calculateRoute(this.direccionCliente, direccionEstablecimiento);
  // }

  itemSelected($event: DeliveryEstablecimiento) {
    console.log('establecimiento seleccionada', $event);
    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(true);

    this.establecimientoService.set($event);

    this.router.navigate(['/callback-auth']);

    // this.veryfyClient = this.verifyClientService.verifyClient()
    //   .subscribe(res => {
    //     if ( !res ) {return; }
    //     // console.log('res idcliente', res);
    //     this.setInfoToken(res);
    //   });
  }

  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      panelClass: 'my-full-screen-dialog',
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.direccionCliente = data;
        this.verifyClientService.setDireccionDeliverySelected(this.direccionCliente);
        // this.setDireccion(data);
      }
    );
  }

}
