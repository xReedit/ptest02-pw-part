import { Component, OnInit } from '@angular/core';
import { TimerLimitService } from 'src/app/shared/services/timer-limit.service';

@Component({
  selector: 'app-progress-time-limit',
  templateUrl: './progress-time-limit.component.html',
  styleUrls: ['./progress-time-limit.component.css']
})
export class ProgressTimeLimitComponent implements OnInit {

  constructor(public timerLimitService: TimerLimitService) { }

  ngOnInit() {
  }

}
