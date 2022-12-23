import { TestBed } from '@angular/core/testing';

import { SendMsjService } from './send-msj.service';

describe('SendMsjService', () => {
  let service: SendMsjService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendMsjService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
