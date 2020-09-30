import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanCodePedidoComponent } from './scan-code-pedido.component';

describe('ScanCodePedidoComponent', () => {
  let component: ScanCodePedidoComponent;
  let fixture: ComponentFixture<ScanCodePedidoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanCodePedidoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanCodePedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
