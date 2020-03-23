import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-encuesta-opcion',
  templateUrl: './encuesta-opcion.component.html',
  styleUrls: ['./encuesta-opcion.component.css']
})
export class EncuestaOpcionComponent implements OnInit {
  @Input() ListOption: any;
  @Output() public NextPregunta = new EventEmitter<any>();

  constructor(
  ) { }

  ngOnInit() {
  }

  xNextPregunta(item: any) {
    setTimeout(() => {
      this.NextPregunta.emit(item);
    }, 300);
  }

}
