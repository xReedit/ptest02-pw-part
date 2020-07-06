import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListGrupoPedidosComponent } from './list-grupo-pedidos.component';

describe('ListGrupoPedidosComponent', () => {
  let component: ListGrupoPedidosComponent;
  let fixture: ComponentFixture<ListGrupoPedidosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListGrupoPedidosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListGrupoPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
