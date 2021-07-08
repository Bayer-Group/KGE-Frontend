import { Component, Input, OnInit } from "@angular/core";
import { ForceDirectedGraph } from "src/app/d3/models/force-directed-graph-new";
import { D3Service } from "src/app/d3/d3-new.service";
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';
import { GraphVisualLink } from 'src/app/models/graphvisual/graphVisualLink';
import { GraphVisualService } from 'src/app/services/graphVisual.service';
import { ConfigurationService } from "src/app/services/configuration.service";

// import { link } from 'fs';

const debug = false;

@Component({
  selector: "d3-graph",
  templateUrl: "./graph.component.html",
  styleUrls: ["./graph.component.scss"]
})

// [hoverableNode]="node"
export class GraphComponent implements OnInit {

  @Input() nodes: GraphVisualNode[];
  @Input() links: GraphVisualLink[];

  graph: ForceDirectedGraph;
  public sim: boolean;
  public OPTIONS: { width; height } = { width: 800, height: 600 };


  get options() {
    return (this.OPTIONS = {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  // tslint:disable-next-line: max-line-length

  constructor(private d3Service: D3Service,
    private _configNew: ConfigurationService,
    private _graphVisual: GraphVisualService) { }

  ngOnInit() {

    /** Receiving an initialized simulated graph from our custom d3 service */
    this.graph = this.d3Service.getForceDirectedGraph(
      this.nodes,
      this.links,
      this.options,
      this._configNew,
      this._graphVisual.baseNodeUri
    );

    this._graphVisual.graphVisualData$.subscribe(res => {
      this.graph.update(res.nodes,
        res.links,
        this._configNew.d3ForceConfig,
        this._configNew.nodeConfig,
        this.options,
        this._graphVisual.baseNodeUri);
    })
  }
}
