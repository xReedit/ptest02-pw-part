import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { Subscription } from 'rxjs/internal/Subscription';
// import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { throttleTime } from 'rxjs/internal/operators/throttleTime';


@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {

  @Input() debounceTime = 500;
  @Output() debounceClick = new EventEmitter();

  private clicks = new Subject();
  private subscription: Subscription;

  constructor() { }

  ngOnInit() {
    this.subscription = this.clicks.pipe(
      throttleTime(this.debounceTime)
    ).subscribe((e: Event) => {
      this.debounceClick.emit(e);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {this.subscription.unsubscribe(); }
  }

  @HostListener('click', ['$event'])
  clickEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }

}
