import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicacionesGrupoMapaComponent } from './indicaciones-grupo-mapa.component';

describe('IndicacionesGrupoMapaComponent', () => {
  let component: IndicacionesGrupoMapaComponent;
  let fixture: ComponentFixture<IndicacionesGrupoMapaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndicacionesGrupoMapaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndicacionesGrupoMapaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
