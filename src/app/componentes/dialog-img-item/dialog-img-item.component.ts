import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { URL_IMG_CARTA } from 'src/app/shared/config/config.const';

@Component({
  selector: 'app-dialog-img-item',
  templateUrl: './dialog-img-item.component.html',
  styleUrls: ['./dialog-img-item.component.css']
})
export class DialogImgItemComponent implements OnInit {
  itemProducto: any;
  url_img = URL_IMG_CARTA;


  constructor(
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.itemProducto = data.item;
  }

  ngOnInit() {
  }

}
