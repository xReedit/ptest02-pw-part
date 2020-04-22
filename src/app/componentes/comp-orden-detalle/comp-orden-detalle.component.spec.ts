import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompOrdenDetalleComponent } from './comp-orden-detalle.component';

describe('CompOrdenDetalleComponent', () => {
  let component: CompOrdenDetalleComponent;
  let fixture: ComponentFixture<CompOrdenDetalleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompOrdenDetalleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompOrdenDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
