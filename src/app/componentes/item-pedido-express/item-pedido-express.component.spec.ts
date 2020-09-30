import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPedidoExpressComponent } from './item-pedido-express.component';

describe('ItemPedidoExpressComponent', () => {
  let component: ItemPedidoExpressComponent;
  let fixture: ComponentFixture<ItemPedidoExpressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPedidoExpressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPedidoExpressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
