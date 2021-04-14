import { ProjectsService } from '../core/services/projects/projects.service'
import { MaterialsService } from '../core/services/materials/materials.service'
import { AnalisisService } from '../core/services/analisis/analisis.service'
import { forkJoin,Observable,Subject } from 'rxjs';
import { ComponentFactoryResolver } from '@angular/core';
import { Router } from '@angular/router';
import conversion from 'src/app/calculos/Conversiones.json';
import transporte from 'src/app/calculos/transportes.json';
import { Injectable } from '@angular/core';
import { stringify } from '@angular/compiler/src/util';

@Injectable({
    providedIn: 'root'
})

export class Calculos {
 materiales_EPIC: number;
 materiales_EPD: number;
 conversion_list:any = conversion;
 transporte_list:any = transporte;
  projectsList: [];
  materialList: [];
  materialSchemeDataList: [];
  materialSchemeProyectList: [];
  potentialTypesList: [];
  standarsList: [];
  CSEList: [];
  SIDList: [];
  SIList: [];
  ACRList: [];
  ECDList: [];
  TEDList: [];
  TEList: [];
  ULList: [];
  ECDPList: [];
  sectionList : [];

  impactosIgnorar2 = ['PARNR','POT','Human toxicity','Fresh water aquatic ecotox.', 'Marine aquatic ecotoxicity', 'Terrestrial ecotoxicity']
  nombreImpactosCompleto = [];

  constructor(
    private materials: MaterialsService,
    private projects: ProjectsService,
    private analisis: AnalisisService,
    private router: Router,
    private componentFactoryResolver: ComponentFactoryResolver
    ){

    forkJoin([
      this.analisis.getTypeEnergy(),
      this.projects.getProjects(),
      this.materials.getMaterials(),
      this.analisis.getMaterialSchemeData(),
      this.analisis.getMaterialSchemeProyect(),
      this.analisis.getPotentialTypes(),
      this.analisis.getStandars(),
      this.analisis.getConstructiveSystemElement(),
      this.analisis.getSourceInformationData(),
      this.analisis.getSourceInformation(),
      this.analisis.getAnnualConsumptionRequired(),
      this.analisis.getElectricityConsumptionData(),
      this.analisis.getTypeEnergyData(),
      this.analisis.getUsefulLife(),
      this.analisis.getECDP(),
      this.analisis.getSectionsList()
    ])
    .subscribe(([
      TE,
      projectsData,
      materialData,
      materialSchemeData,
      materialSchemeProyect,
      potentialTypes,
      standards,
      CSE,
      SID,
      SI,
      ACR,
      ECD,
      TED,
      UL,
      ECDP,
      sectionsList
    ]) => {

      this.projectsList = projectsData;
      this.materialList = materialData;
      this.materialSchemeDataList = materialSchemeData;
      this.materialSchemeProyectList = materialSchemeProyect;
      this.potentialTypesList = potentialTypes;
      this.standarsList = standards;
      this.CSEList = CSE;
      this.SIDList = SID;
      this.SIList = SI;
      this.ACRList = ACR;
      this.ECDList = ECD;
      this.TEDList = TED;
      this.TEList = TE;
      this.ULList = UL;
      this.ECDPList = ECDP;
      this.sectionList = sectionsList;
    });
    console.log('Get de información constructor')
  }

  OperacionesDeFase(idProyecto){
    
    let Datos={}
    let schemeProyect = this.materialSchemeProyectList.filter(msp => msp['project_id'] == idProyecto);
    let impacto_ban = true
    let nameImpacto:string;

    this.materiales_EPIC = 0;
    this.potentialTypesList.forEach((impacto, index) => {
      this.impactosIgnorar2.forEach(ignorar => {
        if (impacto['name_potential_type'] === ignorar) {
          impacto_ban = false;
        }
      })
      if (impacto_ban) {
        nameImpacto=impacto['name_complete_potential_type'];
        nameImpacto=nameImpacto.split(' ').join('\n')
        //nameImpacto=[nameImpacto.slice(0,15),'\n',nameImpacto.slice(15)].join('')
        Datos[nameImpacto] = {};
        let resultado_impacto = 0;
        //Cálculos de la sección de producción
        let etapas = [2, 3, 4] //Subetaps A1 A2 y A3
        Datos[nameImpacto]['Producción'] = {}
        etapas.forEach(subetapa => {
          let subproceso = this.standarsList.filter(s => s['id'] == subetapa)[0]['name_standard'];
          if (schemeProyect.length > 0) {
            schemeProyect.forEach(ps => {
              let materiales_subetapa = this.materialSchemeDataList.filter(msd => msd['material_id'] == ps['material_id'] && msd['standard_id'] == subetapa && msd['potential_type_id'] == impacto['id'])
              if (materiales_subetapa.length > 0) {
                materiales_subetapa.forEach((material, index) => {
                  resultado_impacto = resultado_impacto + (materiales_subetapa[index]['value'] * ps['quantity'])
                })
              }else{
                materiales_subetapa = this.materialSchemeDataList.filter(msd => msd['material_id'] == ps['material_id'] && msd['standard_id'] == 1 && msd['potential_type_id'] == impacto['id'])
                if (materiales_subetapa.length > 0 && impacto['id'] == 3) {
                  resultado_impacto = resultado_impacto +materiales_subetapa[0]['value'] * ps['quantity']
                  this.materiales_EPIC=this.materiales_EPIC+1;
                }
              }
            })
            this.materiales_EPD = schemeProyect.length - this.materiales_EPIC;
          }
          Datos[nameImpacto]['Producción'][subproceso] = resultado_impacto;
          resultado_impacto = 0;
        })
        //console.log('resultado producción = ',resultado_impacto)
        resultado_impacto = 0;
        //Construcción
        Datos[nameImpacto]['Construccion'] = {};
        //A4 Transporte
        if (schemeProyect.length > 0) {
          schemeProyect.forEach(ps => {
            let internacional;
            let nacional;
            if (ps['distance_init'] == null) {
              internacional = 0;
            } else {
              let transporteSeleccionado = 1
              if(ps['transport_id_origin'] != null){
                transporteSeleccionado = ps['transport_id_origin'];
              }
              let value_transport = this.transporte_list.filter(val => val['id_potencial'] == impacto['id'] && val['id_transport'] == transporteSeleccionado)
              internacional = value_transport[0]['valor'] * ps['distance_init'];
            }
            if (ps['distance_end'] == null) {
              nacional = 0;
            } else {
              let transporteSeleccionado = 4
              if(ps['transport_id_end'] != null){
                transporteSeleccionado = ps['transport_id_end'];
              }
              let value_transport = this.transporte_list.filter(val => val['id_potencial'] == impacto['id'] && val['id_transport'] == transporteSeleccionado)
              nacional = value_transport[0]['valor'] * ps['distance_end'];
            }
            let conversion_val = this.conversion_list.filter(val => val['id_material'] == ps['material_id'])
            let peso = 1
            if (conversion_val.length > 0) {
              peso = conversion_val[0]['value']
            }
            //console.log(peso*ps['quantity']*(nacional+internacional))
            resultado_impacto = resultado_impacto + (peso * ps['quantity'] * (nacional + internacional))
          })
        }
        Datos[nameImpacto]['Construccion']['A4'] = resultado_impacto;
        //console.log('A4:',resultado_impacto);
        resultado_impacto = 0;
        //A5 instalación
        let CSEs = this.CSEList.filter(c => c['project_id'] == idProyecto);
        if (CSEs.length > 0) {
          CSEs.forEach(CSE => {
            let energia = this.SIDList.filter(sid => sid['sourceInformarion_id'] == CSE['source_information_id'] && sid['potential_type_id'] == impacto['id'])
            if (energia.length > 0) {
              energia.forEach((element, index) => {
                resultado_impacto = resultado_impacto + (energia[index]['value'] * CSE['quantity']);
              })
            }
          });
        }
        Datos[nameImpacto]['Construccion']['A5'] = resultado_impacto;
        //console.log('A5:',resultado_impacto);
        //Uso
        resultado_impacto = 0;
        Datos[nameImpacto]['Uso'] = {};
        //B4
        //las etapas son las mismas que en la sección de producción
        etapas.forEach(subetapa => {
          if (schemeProyect.length > 0) {
            schemeProyect.forEach(ps => {
              let materiales_subetapa = this.materialSchemeDataList.filter(msd => msd['material_id'] == ps['material_id'] && msd['standard_id'] == subetapa && msd['potential_type_id'] == impacto['id'])
              if (materiales_subetapa.length > 0) {
                materiales_subetapa.forEach((material, index) => {
                  resultado_impacto = resultado_impacto + (materiales_subetapa[index]['value'] * ps['quantity'] * ps['replaces'])
                })
              }else{
                materiales_subetapa = this.materialSchemeDataList.filter(msd => msd['material_id'] == ps['material_id'] && msd['standard_id'] == 1 && msd['potential_type_id'] == impacto['id'])
                if (materiales_subetapa.length > 0 && impacto['id'] == 3) {
                  resultado_impacto = resultado_impacto + materiales_subetapa[0]['value'] * ps['quantity']
                  this.materiales_EPIC = this.materiales_EPIC + 1;
                }
              }
            })
          }
        })
        Datos[nameImpacto]['Uso']['B4'] = resultado_impacto;
        resultado_impacto = 0;
        //B6
        let listaACR = this.ACRList.filter(acr => acr['project_id'] == idProyecto)
        if (listaACR.length > 0) {
          let consumos = this.ECDList.filter(ecd => ecd['annual_consumption_required_id'] == listaACR[0]['id']);
          let vidaUtilID = this.projectsList.filter(p => p['id'] == idProyecto)[0]['useful_life_id']
          let vidaUtil: any = this.ULList.filter(ul => ul['id'] == vidaUtilID)[0]['name_useful_life'];
          try {
            vidaUtil = parseFloat(vidaUtil);
          } catch {
            vidaUtil = 1;
          }
          consumos.forEach(consumo => {
            let valor_impacto = this.TEDList.filter(sid => sid['type_energy_id'] == consumo['type'] && sid['potential_type_id'] == impacto['id'])
            if (valor_impacto.length > 0) {
              resultado_impacto = resultado_impacto + consumo['quantity'] * valor_impacto[0]['value'] * vidaUtil
            }
          })
        }
        Datos[nameImpacto]['Uso']['B6'] = resultado_impacto;
        //console.log('Uso:',resultado_impacto)
        //Fin de vida
        resultado_impacto = 0;
        Datos[nameImpacto]['FinDeVida'] = {};
        //C1
        let ECDPs = this.ECDPList.filter(c => c['project_id'] == idProyecto);
        if (ECDPs.length > 0) {
          ECDPs.forEach(ECDP => {
            let energia = this.SIDList.filter(sid => sid['sourceInformarion_id'] == ECDP['source_information_id'] && sid['potential_type_id'] == impacto['id'])
            resultado_impacto = resultado_impacto + (ECDP['quantity'] * energia[0]['value'])
          })
        }
        Datos[nameImpacto]['FinDeVida']['C1'] = resultado_impacto;
        //C2
        Datos[nameImpacto]['FinDeVida']['C2'] = 0;
        //C3
        Datos[nameImpacto]['FinDeVida']['C3'] = 0;
        //C4
        Datos[nameImpacto]['FinDeVida']['C4'] = 0;
        //console.log('Fin de vida',resultado_impacto)
      }
      impacto_ban = true;
    })

    return Datos
  }

  ValoresProcentaje(data){
    let auxData=[];
    let auxsumetapa={};
    Object.keys(data).forEach(element => {
      let auxsumimpacto=0;
      auxsumetapa[element]={}
      Object.keys(data[element]).forEach( etapa => {
        Object.keys(data[element][etapa]).forEach( subetapa => {
          auxsumimpacto = auxsumimpacto + data[element][etapa][subetapa]
        })
      })
      Object.keys(data[element]).forEach( etapa => {
        auxsumetapa[element][etapa] = {}
        auxsumetapa[element][etapa]['num']=0;
        Object.keys(data[element][etapa]).forEach( subetapa => {
          auxsumetapa[element][etapa]['num'] = auxsumetapa[element][etapa]['num'] + data[element][etapa][subetapa]
        })
        auxsumetapa[element][etapa]['porcentaje'] = (auxsumetapa[element][etapa]['num']/auxsumimpacto) * 100
      })
    })

    return auxsumetapa;
  }

  ImpactosSeleccionados(){
    let impacto_ban=true;
    let auxNombre = [];
    let auxnombreSalto:string;
    this.potentialTypesList.forEach((impacto, index) => {
      this.impactosIgnorar2.forEach(ignorar => {
        if (impacto['name_potential_type'] === ignorar) {
          impacto_ban = false;
        }
      })
      if (impacto_ban) {
        auxnombreSalto=impacto['name_complete_potential_type']
        //auxNombre.push([auxnombreSalto.slice(0,15),'\n',auxnombreSalto.slice(15)].join(''))
        auxNombre.push(auxnombreSalto.split(' ').join('\n'))
      }
      impacto_ban = true;
    }) 

    this.nombreImpactosCompleto = auxNombre;
    return auxNombre;
  }

  ajustarNombre(name:string){
    return name.split(' ').join('\n');
  }

}
