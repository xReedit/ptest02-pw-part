import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-mis-ordenes',
  templateUrl: './mis-ordenes.component.html',
  styleUrls: ['./mis-ordenes.component.css']
})
export class MisOrdenesComponent implements OnInit, OnDestroy {

  private destroy$: Subject<boolean> = new Subject<boolean>();
  infoUser: UsuarioTokenModel;
  listMisPedidos: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private crudService: CrudHttpService,
    private socketSerrvice: SocketService,
  ) { }

  ngOnInit() {

    if ( this.infoTokenService.infoUsToken ) {
      this.infoUser = this.infoTokenService.infoUsToken;
      this.conectSercices();
    } else {
      this.verifyClientService.verifyClient()
      .subscribe(res => {
        this.infoUser = res;
        this.conectSercices();
      });
    }
  }

  private conectSercices() {
    // this.socketSerrvice.connect(this.infoUser, 0);

    this.loadMisPedidos();
    this.listenChangeStatus();
  }

  ngOnDestroy(): void {
    // this.socketSerrvice.isSocketOpenReconect = true;
    // this.socketSerrvice.closeConnection();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private listenChangeStatus(): void {

    this.socketSerrvice.onDeliveryPedidoChangeStatus()
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      console.log('socket listen ', res);
      this.loadMisPedidos();
    });
  }

  loadMisPedidos(): void {
    const _data = {
      idcliente: this.infoUser.idcliente
    };

    this.crudService.postFree(_data, 'delivery', 'get-mis-pedidos', false)
      .subscribe( res => {
        console.log(res);
        this.listMisPedidos = res.data;
        this.listMisPedidos.map( x => {
          switch (x.pwa_delivery_status) {
            case '0':
                x.estado = 'Preparando';
              break;
            case '1':
                x.estado = 'En Camino';
              break;
            case '2':
                x.estado = 'Entregado';
              break;
          }

          return x;
        });
      });
  }

}
