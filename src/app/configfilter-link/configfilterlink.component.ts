import { Component, ElementRef, ViewChild, OnInit, Input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { GraphVisualLink } from "../models/graphvisual/graphVisualLink";
import { ConfigurationService } from "../services/configuration.service";


@Component({
  selector: "config-filter-link",
  templateUrl: "./configfilterlink.component.html",
  styleUrls: ["./configfilterlink.component.scss"]
})
export class ConfigfilterLinkComponent implements OnInit {
  @Input() links: GraphVisualLink[];
  filterStatus: boolean;
  color = "";
  toppings = new FormControl();
  typeList = new Set<string>();
  @ViewChild("configfilterlink", { static: true }) searchbar: ElementRef;

  constructor(private _config: ConfigurationService) { }

  ngOnInit(): void {
    this.fillTypeList();
    console.log(this.typeList)
  }


  hidefilter() {
    this._config.showColorFilterLink = false;
  }

  fillTypeList() {
    console.log(this.links)
    if (this.links) {
      for (const linkType of this.links) {
        if(!this.typeList.has(linkType.label))
          this.typeList.add(linkType.label)        
      }
    }
  }


  resetfilter() {
   // this._config.nodeColorMap.clear();
   // use linkColorMap
  }

  // updateFirestoreColor creates a key, value pair as soon as you pick a value (node object) of the dropdown menu and a color.
  // This key value pair gets saved in nodeColorMap
  // We then get into the get color function of node-visual-new.component.ts

  updateFirestoreColor(event) {
    // use linkColorMap
    /*
    if (this.toppings.value && this.color) {
      for (const typeClass of this.toppings.value) {
        console.log(typeClass)
        this._config.nodeColorMap.set(typeClass, this.color)
        console.log(this._config.nodeColorMap)
      }
    }*/
  }

}
