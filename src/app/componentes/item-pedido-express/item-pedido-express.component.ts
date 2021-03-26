import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { GpsUbicacionRepartidorService } from 'src/app/shared/services/gps-ubicacion-repartidor.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogDesicionComponent } from '../dialog-desicion/dialog-desicion.component';


@Component({
  selector: 'app-item-pedido-express',
  templateUrl: './item-pedido-express.component.html',
  styleUrls: ['./item-pedido-express.component.css']
})
export class ItemPedidoExpressComponent implements OnInit {
  @Input() elpedido: any;
  @Output() pedidoEntregado = new EventEmitter<any>();

  metodoPago = '';
  desde = '';
  hasta = '';
  dirDesde: any;
  dirHasta: any;
  desde_referencia = '';
  hasta_referencia = '';
  descripcion_pedido = '';
  nomCliente = '';
  telCliente = '';
  isPagoYape = false;
  isPedidoExpress = false;
  isRetiroAtm = false;

  goRutaHasta = false;
  goRutaDesde = false;

  sumKmRecorrer = '';
  importe  = 0;
  numPedido = 0;

  geoPositionActual: GeoPositionModel;

  constructor(
    private geoPositionService: GpsUbicacionRepartidorService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.isPedidoExpress = this.elpedido.pedido_json?.is_express === 1; // sino es mandado
    this.isRetiroAtm = this.elpedido?.isretiroatm === 1 || !!this.elpedido?.idatm_retiros;
    if ( this.elpedido?.isretiroatm ) {
      this.elpedido.idpedido_mandado = this.elpedido.idatm_retiros;
    }

    if ( this.isRetiroAtm ) {
      this.metodoPago = 'Tarjeta';
      this.descripcion_pedido = 'Solicita retiro de dinero en efectivo S/.' + parseFloat(this.elpedido.importe_solicita).toFixed(2);
      this.nomCliente = this.elpedido.json_entrega.cliente.nombres;
      this.telCliente = this.elpedido.json_entrega.cliente.telefono;
      this.numPedido = this.elpedido.idatm_retiros;

      this.desde = '';

      this.dirHasta = this.elpedido.json_entrega.direccion;
      this.hasta = this.elpedido.json_entrega.direccion.direccion;
      this.hasta_referencia = this.elpedido.json_entrega.direccion.referencia;
      this.goRutaHasta = true;

      this.importe = this.elpedido.c_entrega; // costo de entrega

      this.sumKmRecorrer = '';
      return;
    }

    this.isPagoYape = this.elpedido.pedido_json.metodoPago.idtipo_pago === 3;
    this.metodoPago = this.isPagoYape ? 'Yape' :  `Efectivo ${this.elpedido.pedido_json.metodoPago.importe}`;
    this.descripcion_pedido = this.isPedidoExpress ? this.elpedido.pedido_json.descripcion_paquete : this.elpedido.pedido_json.que_compramos;
    this.nomCliente = this.elpedido.nom_cliente;
    this.telCliente = this.elpedido.telefono;
    this.numPedido = this.elpedido.idpedido_mandado;

    if ( this.isPedidoExpress ) {
      this.dirDesde = this.elpedido.pedido_json.direccionA;
      this.desde = this.dirDesde.direccion;
      this.desde_referencia = this.dirDesde.referencia;

      this.dirHasta = this.elpedido.pedido_json.direccionB;
      this.hasta = this.dirHasta.direccion;
      this.hasta_referencia = this.dirHasta.referencia;

      this.goRutaDesde = true;
      this.goRutaHasta = true;
    } else {
      this.desde = this.elpedido.pedido_json.donde_compramos;
      this.desde_referencia = null;

      this.dirHasta = this.elpedido.pedido_json.direccionCliente;
      this.hasta = this.dirHasta.direccion;
      this.hasta_referencia = this.dirHasta.referencia;
      this.goRutaDesde = false;
      this.goRutaHasta = true;
    }

    this.sumKmRecorrer = this.elpedido.pedido_json.distancia_km;
    this.importe = this.elpedido.pedido_json.importe_pagar;

  }

  irRuta(op: number) {
    this.geoPositionService.get();
    this.geoPositionActual = this.geoPositionService.getGeoPosition();

    if ( op === 1 ) {
      // hasta
      const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.dirHasta.latitude},${this.dirHasta.longitude}`;
      window.open(linkGPS, '_blank');
    } else {
      if ( this.goRutaDesde ) {
        const linkGPS = `http://maps.google.com/maps?saddr=${this.geoPositionActual.latitude},${this.geoPositionActual.longitude}&daddr=${this.dirDesde.latitude},${this.dirDesde.longitude}`;
        window.open(linkGPS, '_blank');
      }
    }
  }

  finalizarPedidoExpress() {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = {idMjs: 2};

    console.log('show dialog DialogDesicionComponent');
    const dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        console.log('aaaaaaaaaaaaaaaaaaaaaaaaa');
        if ( this.isRetiroAtm ) {
          this.elpedido.idpedido_mandado = this.elpedido.idatm_retiros;
        }
        this.pedidoEntregado.emit(this.elpedido);
      }
    });
  }

  redirectWhatsApp() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.elpedido.telefono}`;
    window.open(_link, '_blank');
  }

  callPhone() {
    window.open(`tel:${this.elpedido.telefono}`);
  }

}
