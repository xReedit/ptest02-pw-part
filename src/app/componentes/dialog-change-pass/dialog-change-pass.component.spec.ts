import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogChangePassComponent } from './dialog-change-pass.component';

describe('DialogChangePassComponent', () => {
  let component: DialogChangePassComponent;
  let fixture: ComponentFixture<DialogChangePassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogChangePassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogChangePassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
