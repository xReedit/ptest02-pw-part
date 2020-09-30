import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {  BarcodeFormat } from '@zxing/library/esm5';

@Component({
  selector: 'app-scan-code-pedido',
  templateUrl: './scan-code-pedido.component.html',
  styleUrls: ['./scan-code-pedido.component.css']
})
export class ScanCodePedidoComponent implements OnInit {

  @Output() codeScanSucces = new EventEmitter();
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

  // allowedFormats: any;
  allowedFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_8, BarcodeFormat.EAN_13, BarcodeFormat.CODABAR, BarcodeFormat.MAXICODE, , BarcodeFormat.CODE_128];

  constructor(
  ) { }

  ngOnInit(): void {

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

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  scanSuccessHandler($event: any) {
    // console.log($event);
    this.codQR = $event;
    // this.isProcesando = true;
    this.leerDatosQR();
    // this.getPosition();
  }

  // leer qr // formato keyQrPwa::5|-6.0283481:-76.9714528|1 -> mesa | coordenadas del local | idsede
  private leerDatosQR() {
    this.isCodigoQrValido = true;
    console.log('codigo escaneado', this.codQR);
    // let _codQr = '';

    // try {
    const _codQr = this.codQR.split('-');
    this.isCodigoQrValido = _codQr[0].toString() === '369' ? true : false;
    console.log('_codQr', _codQr);
    console.log('_codQr', _codQr[1]);

    if ( !this.isCodigoQrValido ) {
      return;
    }

    this.codeScanSucces.emit(_codQr[1]);
    // } catch (error) {
    //   this.resValidQR(false);
    //   return;
    // }

    // const isValidKeyQR = _codQr[0] === 'keyQrPwa' ? true : false;
    // if ( !isValidKeyQR ) {
    //   this.isDemo = _codQr[0] === 'keyQrPwaDemo' ? true : false;
    // }


    // // no se encuentra el key no es qr valido
    // if ( !isValidKeyQR && !this.isDemo) {
    //   this.resValidQR(isValidKeyQR);
    //   return;
    // }

    // // const dataQr = this.codQR.split('|');
    // const dataQr = _codQr[1].split('|');
    // const m = dataQr[0];
    // const s = dataQr[2];
    // const o = dataQr[3];

    // // -1 = solo llevar // activa ubicacion
    // this.isSoloLLevar =  m === '-1' ? true : false;
    // this.isDelivery =  m === '-2' ? true : false;

    // const dataSend = {
    //   m: m,
    //   s: s
    // };

    // // consultar si sede requiere geolocalizacion
    // const dataHeader = {
    //   idsede: s
    // };

    // this.crudService.postFree(dataHeader, 'ini', 'info-sede-gps', false)
    //   .subscribe((res: any) => {
    //     this.isSedeRequiereGPS = res.data[0].pwa_requiere_gps === '0' ? false : true;
    //     this.isSedeRequiereGPS = this.isSoloLLevar ? true : this.isSedeRequiereGPS;
    //     this.isSedeRequiereGPS = this.isDelivery ? false : this.isSedeRequiereGPS;


    //     // setear idsede en clienteSOcket
    //     this.verifyClientService.getDataClient();
    //     if ( !this.isSoloLLevar ) { this.verifyClientService.setMesa(m); }
    //     this.verifyClientService.setIdSede(s);
    //     this.verifyClientService.setQrSuccess(true);
    //     this.verifyClientService.setIsSoloLLevar(this.isSoloLLevar);
    //     this.verifyClientService.setIsDelivery(this.isDelivery);

    //     if ( this.isDelivery ) {
    //       // this.infoTokenService.converToJSON();
    //       // this.infoTokenService.infoUsToken.isDelivery = true;
    //       // this.infoTokenService.set();
    //       this.verifyClientService.setIdOrg(o);
    //       this.getInfoEstablecimiento(s);

    //     }
    //     // this.verifyClientService.setDataClient();

    //     const position = dataQr[1].split(':');
    //     const localPos = { lat: parseFloat(position[0]), lng: parseFloat(position[1]) };

    //     const isPositionCorrect = true;
    //     if ( this.isSedeRequiereGPS ) {
    //       // this.getPosition();
    //       // isPositionCorrect = this.isDemo ? true : this.arePointsNear(localPos, this.divicePos, 1);
    //       this.openDialogPOS(localPos);
    //     } else {
    //       this.resValidQR(isPositionCorrect);
    //     }

    // });
  }

}
