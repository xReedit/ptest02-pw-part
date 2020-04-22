import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaOrdenesComponent } from './mapa-ordenes.component';

describe('MapaOrdenesComponent', () => {
  let component: MapaOrdenesComponent;
  let fixture: ComponentFixture<MapaOrdenesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapaOrdenesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapaOrdenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
