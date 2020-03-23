import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  toLatLon, toLatitudeLongitude, headingDistanceTo, moveTo, insidePolygon, insideCircle
} from 'geolocation-utils';

@Component({
  selector: 'app-dialog-ubicacion',
  templateUrl: './dialog-ubicacion.component.html',
  styleUrls: ['./dialog-ubicacion.component.css']
})
export class DialogUbicacionComponent implements OnInit {

  cLocal: any; // coordenadas del establecimientos
  cDispositivo: any; // coordenadas del dispositivo
  hasPermissionPosition = true;

  constructor(
    private dialogRef: MatDialogRef<DialogUbicacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.cLocal = data.cLocal;

   }

  ngOnInit() {
    this.loadGPS();
  }

  private loadGPS() {
    setTimeout(() => {
      // loading
      this.getPosition();
    }, 4000);
  }

  private getPosition() {
    navigator.geolocation.getCurrentPosition((position: any) => {
      const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
      this.cDispositivo = divicePos;
      this.hasPermissionPosition = true;

      this.data.posIssValid = this.data.isDemo ? true :  this.arePointsNear(this.cLocal, this.cDispositivo, 1);
      this.cerrarDlg();
    }, this.showPositionError);
  }

  private showPositionError(error: any): void {
    // if ( error.PERMISSION_DENIED ) {
      this.hasPermissionPosition = false;
      this.data.posIssValid = false;
      this.cerrarDlg();
    // }

  }

  private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
    // const ky = 40000 / 360;
    // const kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
    // const dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    // const dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    // return Math.sqrt(dx * dx + dy * dy) <= km;

    const center = {lat: centerPoint.lat, lon: centerPoint.lng };
    const radius = 65; // meters

    // insideCircle({lat: 51.03, lon: 4.05}, center, radius) // true
    return insideCircle({lat: checkPoint.lat, lon: checkPoint.lng}, center, radius);  // false
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.data.posIssValid);
  }

}
