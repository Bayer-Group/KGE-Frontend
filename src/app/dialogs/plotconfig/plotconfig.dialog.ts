import { MatDialogRef, MAT_DIALOG_DATA} from "@angular/material/dialog";
import { Component, Inject, ViewEncapsulation, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { DBConfigService, DBPath } from 'src/app/services/dbconfig.service';

export interface PlotConfigData {
    disableTBox: boolean;
    bidirectional: boolean;
    numPaths: number;
    maxPathLength: number;
    shortestPath: boolean;
    pathRange: number[];
    showRange: boolean;
}

export interface DBItem {
  instance: string;
  dbpath: string;
  selectedNamedGraphs?: string[];
  virtualGraph?: string;
}

@Component({
  selector: "plotconfig-dialog",
  templateUrl: "plotconfig.dialog.html",
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["plotconfig.dialog.scss"],
})
export class PlotConfigDialogComponent implements OnInit {

  // virtual
  virtualGraphsControl = new FormControl();
  selectedNamedGraphsMap: Map<DBPath,string[]> = new Map();
  selectedDBPaths: DBPath[];

  selectedSlider;
  initialData = {};


  rangeConfig = {
    behaviour: "drag",
      connect: true,
      margin: 1,
      step: 1,
      range: {
        min: 0,
        max: 20,
      },
      tooltips: [true, true],
      pips: {
        mode: "count",
        density: 2,
        values: 2,
        stepped: true,
      }
  };

  //ToDO Remove PlotConfigData if not needed!!!
  
  constructor(
    public dialogRef: MatDialogRef<PlotConfigDialogComponent>,
    public dbConfig: DBConfigService,
    @Inject(MAT_DIALOG_DATA) public data: PlotConfigData) {
      this.initialData = {...data};
      if (this.data.numPaths > 0) {
        this.selectedSlider = "numPaths";
      } else if (this.data.maxPathLength > 0) {
        this.selectedSlider = "maxPathLength";
      } else if (this.data.showRange) {
        this.selectedSlider = "pathRange";
      }
      dialogRef.backdropClick().subscribe(_ => {
        this.dialogRef.close(this.initialData);
      });

    }


  ngOnInit(): void {
    this.virtualGraphsControl.setValue(this.dbConfig.selectedVirtualGraphs);
    this.selectedDBPaths = this.dbConfig.selectedDBPaths;
    this.selectedNamedGraphsMap = this.dbConfig.selectedNamedGraphs;
  }

  addDBSelect() {
    this.selectedDBPaths.push(this.dbConfig.dbPaths[0]);
  }

  removeDBSelect(i: number) {
    this.selectedDBPaths = this.selectedDBPaths.filter((value, index) => index !== i);
  }

  resetCheckbox() {
    this.data.numPaths = this.selectedSlider === "numPaths" ? this.data.numPaths : 0;
    this.data.maxPathLength = this.selectedSlider === "maxPathLength" ? this.data.maxPathLength : 0;
    this.data.showRange = this.selectedSlider === "pathRange";
    this.data.pathRange = this.data.showRange ? this.data.pathRange : [0, 1];
  }

  updateNumPaths(e) {
    this.data.numPaths = e.value;
  }

  updateMaxPathLength(e) {
    this.data.maxPathLength = e.value;
  }

  saveData() {
    const finalData = {
      ...this.data
    };
    this.dbConfig.selectedVirtualGraphs = this.virtualGraphsControl.value;
    this.dbConfig.selectedNamedGraphs = this.selectedNamedGraphsMap;
    this.dbConfig.selectedDBPaths = this.selectedDBPaths;
    this.dialogRef.close(finalData);
  }

  onNoClick(): void {
    this.dialogRef.close(this.initialData);
  }

  getNamedGraphs(dbPath: DBPath): string[] {
    return this.dbConfig.getNamedGraphs(dbPath);
  }

  selectNamedGraphs(value: string[], selectedDb: DBPath) {
    this.selectedNamedGraphsMap.set(selectedDb, value);
  }

  selectDBPath(value: DBPath, index: number) {
    this.selectedDBPaths[index] = value;
  }


  getSelectedNamedGraphs(selectedDb: DBPath) {
    return this.dbConfig.selectedNamedGraphs.get(selectedDb);
  }
}
