import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaPedidosComponent } from './mapa-pedidos.component';

describe('MapaPedidosComponent', () => {
  let component: MapaPedidosComponent;
  let fixture: ComponentFixture<MapaPedidosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapaPedidosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapaPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
