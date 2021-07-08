import { Component, ElementRef, ViewChild, OnInit, Input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { ConfigurationService } from "../services/configuration.service";

@Component({
  selector: 'config-filter-uri',
  templateUrl: './configfilter-uri.component.html',
  styleUrls: ['./configfilter-uri.component.scss']
})
export class ConfigfilterUriComponent implements OnInit {
  @Input() nodes: GraphVisualNode[];
  filterStatus: boolean;
  color = "";
  stringList = new Set<String>();
  toppings = new FormControl();
  uriList = new Set<GraphVisualNode>();
  @ViewChild("configfilterUri", { static: true }) searchbar: ElementRef;

  constructor(private _config: ConfigurationService) { }

  ngOnInit(): void {
    this.fillStringList();
  }


  hidefilter() {
    this._config.showColorFilterUri = false;
  }

  fillStringList() {
    if (this.nodes) {
      for (const nodename of this.nodes) {
        if (nodename.uri) {
          this.stringList.add(nodename.uriNamespace);
        }
      }
    }
  }


  resetfilter() {
    this._config.nodeColorMap.clear();
  }

  updateFirestoreColor(event) {
    if (this.toppings.value && this.color) {
      for (const namespace of this.toppings.value) {
        this._config.nodeNamespaceColorMap.set(namespace, this.color);
      }
    }
  }
}
