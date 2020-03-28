import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit {
  @Input() coordenadas: any;
  constructor() { }

  ngOnInit() {
    this.coordenadas.zoom = 15;
    console.log('mapa solo', this.coordenadas);
  }

}
