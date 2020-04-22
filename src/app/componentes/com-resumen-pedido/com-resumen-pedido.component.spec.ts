import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComResumenPedidoComponent } from './com-resumen-pedido.component';

describe('ComResumenPedidoComponent', () => {
  let component: ComResumenPedidoComponent;
  let fixture: ComponentFixture<ComResumenPedidoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComResumenPedidoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComResumenPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
