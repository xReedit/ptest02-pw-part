import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogOrdenDetalleComponent } from './dialog-orden-detalle.component';

describe('DialogOrdenDetalleComponent', () => {
  let component: DialogOrdenDetalleComponent;
  let fixture: ComponentFixture<DialogOrdenDetalleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogOrdenDetalleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogOrdenDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
