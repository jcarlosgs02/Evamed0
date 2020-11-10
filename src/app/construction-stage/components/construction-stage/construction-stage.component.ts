import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatListOption } from '@angular/material/list';
import { MatAccordion } from '@angular/material/expansion';
import 'rxjs/add/operator/filter';

@Component({
  selector: 'app-construction-stage',
  templateUrl: './construction-stage.component.html',
  styleUrls: ['./construction-stage.component.scss']
})

export class ConstructionStageComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  sheetNames: any;
  contentData: any;
  listData: any;
  indexSheet: any;
  SistemasConstructivos: any;
  EnergiaConsumida: {
    cantidad, 
    unidad,
    fuente,
  }[] = [{ 
    cantidad : 0, 
    unidad: '',
    fuente: ''
  }];
  dataArrayEC = [];

  AguaConsumida: {
    cantidad, 
    unidad,
    fuente,
  }[] = [{ 
    cantidad : 0, 
    unidad: '',
    fuente: ''
  }];
  dataArrayAC = [];

  DesechosGenerados: {
    cantidad, 
    unidad,
    fuente,
  }[] = [{ 
    cantidad : 0, 
    unidad: '',
    fuente: ''
  }];
  dataArrayDG = [];

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    const data = JSON.parse(sessionStorage.getItem('dataProject'));
    this.sheetNames = data.sheetNames;
    this.contentData = data.data;
    this.dataArrayEC.push(this.EnergiaConsumida);
    this.dataArrayAC.push(this.AguaConsumida);
    this.dataArrayDG.push(this.DesechosGenerados);
  }

  addFormEC() {
    this.EnergiaConsumida = [{ 
      cantidad : 0, 
      unidad: '',
      fuente: ''
    }];
    this.dataArrayEC.push(this.EnergiaConsumida);
  }

  removeFormEC(i) {
    this.dataArrayEC.splice(i)
  }

  onSaveEC() {
    console.log(this.dataArrayEC);
  }

  addFormAC() {
    this.AguaConsumida = [{ 
      cantidad : 0, 
      unidad: '',
      fuente: ''
    }];
    this.dataArrayAC.push(this.AguaConsumida);
  }

  removeFormAC(i) {
    this.dataArrayAC.splice(i)
  }

  onSaveAC() {
    console.log(this.dataArrayAC);
  }

  addFormDG() {
    this.DesechosGenerados = [{ 
      cantidad : 0, 
      unidad: '',
      fuente: ''
    }];
    this.dataArrayDG.push(this.DesechosGenerados);
  }

  removeFormDG(i) {
    this.dataArrayDG.splice(i)
  }

  onSaveDG() {
    console.log(this.dataArrayDG);
  }

  onGroupsChange(options: MatListOption[]) {
    let selectedSheet;
    // map these MatListOptions to their values
    options.map(option => {
      selectedSheet = option.value;
    });
    // take index of selection
    this.indexSheet = this.sheetNames.indexOf(selectedSheet);
    this.listData = this.contentData[this.indexSheet];
    // get "sistemas constructivos"
    const sistConstructivos = [];
    this.listData.map( sc => {
      sistConstructivos.push(sc.Sistema_constructivo);
    });
    this.SistemasConstructivos = [...new Set(sistConstructivos)];
  }

  onNgModelChange(event) {
    // console.log('on ng model change', event);
  }
}
