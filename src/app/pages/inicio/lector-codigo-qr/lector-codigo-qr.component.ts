import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
// import { Auth0Service } from 'src/app/shared/services/auth0.service';
// import { Subscription } from 'rxjs/internal/Subscription';
// import { take } from 'rxjs/operators';

// import {
//   toLatLon, toLatitudeLongitude, headingDistanceTo, moveTo, insidePolygon, insideCircle
// } from 'geolocation-utils';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogUbicacionComponent } from 'src/app/componentes/dialog-ubicacion/dialog-ubicacion.component';

// import {QrScannerComponent} from 'angular2-qrscanner';

@Component({
  selector: 'app-lector-codigo-qr',
  templateUrl: './lector-codigo-qr.component.html',
  styleUrls: ['./lector-codigo-qr.component.css'],
  // encapsulation: ViewEncapsulation.None,
})
export class LectorCodigoQrComponent implements OnInit, OnDestroy {

  codQR = '';
  hasDevices: boolean;
  hasPermission = true;
  hasPermissionPosition = true;
  isProcesando = false;

  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo = null;
  indexSelectCamera = 0;
  isOptionChangeCamera = false;
  isCodigoQrValido = true;
  isCameraReady = false;
  isSedeRequiereGPS = false; // si sede ruquiere gps
  isSoloLLevar = false; // si escanea qr solo para llevar

  // hasPermissionPosition = false;

  private isDemo = false;
  private divicePos: any;


  // private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private crudService: CrudHttpService,
    private dialog: MatDialog,
    private router: Router ) { }

  ngOnInit() {

    // const qrScanner = new QrScanner(this.videoplayer, (result: any) => // console.log('decoded qr code:', result));

    // verifica si hay usuario logeado
    // this.verifyClientService.verifyClient();
    // this.veryfyClient = this.verifyClientService.verifyClient()
    //   .pipe(take(1))
    //   .subscribe(res => {
    //     console.log('res idcliente', res);
    //   });

    // this.verifyAceptPosition();
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    // this.veryfyClient.unsubscribe();
    this.currentDevice = null;
  }

  scanSuccessHandler($event: any) {
    // console.log($event);
    this.codQR = $event;
    this.isProcesando = true;
    this.leerDatosQR();
    // this.getPosition();
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  // getPosition(): void {
  //   this.hasPermissionPosition = true;
  //   navigator.geolocation.getCurrentPosition((position: any) => {
  //     const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
  //     // this.leerDatosQR(divicePos);
  //     this.divicePos = divicePos;

  //   }, this.showPositionError);
  // }

  // verifyAceptPosition() {
  //   navigator.geolocation.getCurrentPosition(this.getPosition, (error: any) => {
  //     // El segundo parámetro es la función de error
  //         switch (error.code) {
  //             case error.PERMISSION_DENIED:
  //               this.hasPermissionPosition = false;
  //                 // El usuario denegó el permiso para la Geolocalización.
  //                 break;
  //             case error.POSITION_UNAVAILABLE:
  //                 // La ubicación no está disponible.
  //                 this.hasPermissionPosition = false;
  //                 break;
  //             case error.TIMEOUT:
  //                 // Se ha excedido el tiempo para obtener la ubicación.
  //                 break;
  //             case error.UNKNOWN_ERROR:
  //                 // Un error desconocido.
  //                 this.hasPermissionPosition = false;
  //                 break;
  //         }
  //   });
  // }

  private showPositionError(error: any): void {
    // if ( error.PERMISSION_DENIED ) {
      this.hasPermissionPosition = false;
    // }

  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    this.indexSelectCamera = devices.length - 1;
    this.isOptionChangeCamera = this.indexSelectCamera > 0 ? true : false;
    this.deviceSelectChange();
    // console.log(this.availableDevices);
  }

  onDeviceSelectChange(): void {
    this.isCameraReady = false;
    const countCamaras = this.availableDevices.length - 1;
    this.indexSelectCamera = this.indexSelectCamera === countCamaras ? 0 : this.indexSelectCamera + 1;
    this.deviceSelectChange();
  }

  private deviceSelectChange(): void {
    const device = this.availableDevices[this.indexSelectCamera];
    this.currentDevice = device || null;

    setTimeout(() => {
      this.isCameraReady = true;
    }, 1000);
  }

  // leer qr // formato keyQrPwa::5|-6.0283481:-76.9714528|1 -> mesa | coordenadas del local | idsede
  private leerDatosQR() {
    this.isCodigoQrValido = true;
    let _codQr = [];

    try {
      _codQr = atob(this.codQR).split('::');
    } catch (error) {
      this.resValidQR(false);
      return;
    }

    const isValidKeyQR = _codQr[0] === 'keyQrPwa' ? true : false;
    if ( !isValidKeyQR ) {
      this.isDemo = _codQr[0] === 'keyQrPwaDemo' ? true : false;
    }


    // no se encuentra el key no es qr valido
    if ( !isValidKeyQR && !this.isDemo) {
      this.resValidQR(isValidKeyQR);
      return;
    }

    // const dataQr = this.codQR.split('|');
    const dataQr = _codQr[1].split('|');
    const m = dataQr[0];
    const s = dataQr[2];

    // -1 = solo llevar // activa ubicacion
    this.isSoloLLevar =  m === '-1' ? true : false;

    const dataSend = {
      m: m,
      s: s
    };

    // consultar si sede requiere geolocalizacion
    const dataHeader = {
      idsede: s
    };

    this.crudService.postFree(dataHeader, 'ini', 'info-sede-gps', false)
      .subscribe((res: any) => {
        this.isSedeRequiereGPS = res.data[0].pwa_requiere_gps === '0' ? false : true;
        this.isSedeRequiereGPS = this.isSoloLLevar ? true : this.isSedeRequiereGPS;


        // setear idsede en clienteSOcket
        if ( !this.isSoloLLevar ) { this.verifyClientService.setMesa(m); }
        this.verifyClientService.getDataClient();
        this.verifyClientService.setIdSede(s);
        this.verifyClientService.setQrSuccess(true);
        this.verifyClientService.setIsSoloLLevar(this.isSoloLLevar);
        // this.verifyClientService.setDataClient();

        const position = dataQr[1].split(':');
        const localPos = { lat: parseFloat(position[0]), lng: parseFloat(position[1]) };

        const isPositionCorrect = true;
        if ( this.isSedeRequiereGPS ) {
          // this.getPosition();
          // isPositionCorrect = this.isDemo ? true : this.arePointsNear(localPos, this.divicePos, 1);
          this.openDialogPOS(localPos);
        } else {
          this.resValidQR(isPositionCorrect);
        }

    });
  }

  private openDialogPOS(localPos: any) {
    let isPositionValid = false;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      cLocal: localPos,
      isDemo: this.isDemo
    };
    const dialogRef = this.dialog.open(DialogUbicacionComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { isPositionValid = false; }
        // console.log('data dialog', data);
        isPositionValid = data;
        this.resValidQR(isPositionValid);
      }
    );
  }

  private resValidQR(isValid: boolean): void {
    if ( isValid ) {
      // console.log('pase correcto');
      setTimeout(() => {
        this.router.navigate(['/lector-success']);
      }, 1000);
    } else {
      this.isCodigoQrValido = false;
    }
  }

  // calcula si esta dentro del rango
  // private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
  //   // const ky = 40000 / 360;
  //   // const kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
  //   // const dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
  //   // const dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
  //   // return Math.sqrt(dx * dx + dy * dy) <= km;

  //   const center = {lat: centerPoint.lat, lon: centerPoint.lng };
  //   const radius = 65; // meters

  //   // insideCircle({lat: 51.03, lon: 4.05}, center, radius) // true
  //   return insideCircle({lat: checkPoint.lat, lon: checkPoint.lng}, center, radius);  // false
  // }

  volverALeer(): void {
    this.isProcesando = false;
    this.isCodigoQrValido = true;
  }

}
