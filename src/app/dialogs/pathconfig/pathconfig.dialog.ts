import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject, ViewEncapsulation } from "@angular/core";
import { Node } from "../../d3/models/node";
import { DBConfigRequest } from "src/app/services/dbconfig.service";

export interface PathConfigData {
    from: string;
    to: string;
    disableTBox: boolean;
    bidirectional: boolean;
    numPaths: number;
    maxPathLength: number;
    shortestPath: boolean;
    pathRange: number[];    
    dbconfig: DBConfigRequest[];
    showRange: boolean;
}

export interface PathData {
  pathConfig: PathConfigData;
  nodes: Node[];
  resetData: boolean;
}

@Component({
  selector: "pathconfig-dialog",
  templateUrl: "pathconfig.dialog.html",
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["pathconfig.dialog.scss"],
})
export class PathConfigDialogComponent {

  pathConfig: PathConfigData;

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

  constructor(
    public dialogRef: MatDialogRef<PathConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public pathData: PathData) {
      this.pathConfig = pathData.pathConfig;
      this.initialData = {...this.pathConfig};
      if (this.pathConfig.numPaths > 0) {
        this.selectedSlider = "numPaths";
      } else if (this.pathConfig.maxPathLength > 0) {
        this.selectedSlider = "maxPathLength";
      } else if (this.pathConfig.showRange) {
        this.selectedSlider = "pathRange";
      }

      dialogRef.backdropClick().subscribe(_ => {
        this.dialogRef.close();
      });
  }

  resetCheckbox() {
    this.pathConfig.numPaths = this.selectedSlider === "numPaths" ? this.pathConfig.numPaths : 0;
    this.pathConfig.maxPathLength = this.selectedSlider === "maxPathLength" ? this.pathConfig.maxPathLength : 0;
    this.pathConfig.showRange = this.selectedSlider === "pathRange";
    this.pathConfig.pathRange = this.pathConfig.showRange ? this.pathConfig.pathRange : [0, 1];
  }

  updateNumPaths(e) {
    this.pathConfig.numPaths = e.value;
  }

  updateMaxPathLength(e) {
    this.pathConfig.maxPathLength = e.value;
  }

  resetPath() {
    this.pathConfig.to = "";
    this.pathConfig.from = "";
    this.dialogRef.close(this.pathConfig);
  }

  saveData() {
    const finalData = {
      ...this.pathConfig,
    };
    this.dialogRef.close(finalData);
  }

  onNoClick(): void {
    this.dialogRef.close(this.initialData);
  }

}
