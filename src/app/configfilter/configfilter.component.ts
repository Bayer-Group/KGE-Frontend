import { Component, AfterViewInit, ElementRef, ViewChild, OnInit, Input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { ConfigurationService } from "../services/configuration.service";


@Component({
  selector: "config-filter",
  templateUrl: "./configfilter.component.html",
  styleUrls: ["./configfilter.component.scss"]
})
export class ConfigfilterComponent implements OnInit {
  @Input() nodes: GraphVisualNode[];
  filterStatus: boolean;
  color = "";
  toppings = new FormControl();
  classList = new Set<GraphVisualNode>();
  @ViewChild("configfilter", { static: true }) searchbar: ElementRef;

  constructor(private _config: ConfigurationService) { }

  ngOnInit(): void {
    this.fillClassList();
    console.log(this.classList)
  }


  hidefilter() {
    this._config.showColorFilter = false;
  }

  // we fill the classList with all node Objects who are of type class
  // this list is the dropdown menu to color classes.

  fillClassList() {
    if (this.nodes) {
      for (const nodename of this.nodes) {
        if (nodename.isClass) {
          this.classList.add(nodename);
        }
      }
    }
  }


  resetfilter() {
    this._config.nodeColorMap.clear();
  }

  // updateFirestoreColor creates a key, value pair as soon as you pick a value (node object) of the dropdown menu and a color.
  // This key value pair gets saved in nodeColorMap
  // We then get into the get color function of node-visual-new.component.ts

  updateFirestoreColor(event) {
    if (this.toppings.value && this.color) {
      for (const typeClass of this.toppings.value) {
        console.log(typeClass)
        this._config.nodeColorMap.set(typeClass, this.color)
        console.log(this._config.nodeColorMap)
      }
    }
  }

}
