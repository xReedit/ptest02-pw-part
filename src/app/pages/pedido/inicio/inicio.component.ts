import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

import { Event as NavigationEvent, Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  isVisibleToolBar = true;
  countTotalItems = 0;
  private lastValScrollTop = 0;

  constructor(
    private miPedidoService: MipedidoService,
    private router: Router
  ) {

    router.events.pipe(
      filter((event: NavigationEvent) => {
        return (event instanceof NavigationStart);
      })
    ).subscribe(
      (event: NavigationStart) => {
        console.log('navigation', event);
      });
  }

  ngOnInit() {

    this.miPedidoService.countItemsObserve$.subscribe((res) => {
      this.countTotalItems = res;
    });
  }

  onScroll($event: any): void {
    const val = $event.srcElement.scrollTop;
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 54 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }

  addLink(propiedad) {
    // this.router.navigate(['/', { id: propiedad}]);
    this.router.navigate(['../../', { id: propiedad }]);
  }
}
