import { EventEmitter } from "@angular/core";
import * as d3 from "d3";
import { GraphVisualLink } from 'src/app/models/graphvisual/graphVisualLink';
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';
import { ConfigurationService, D3ForceConfig, NodeConfig } from 'src/app/services/configuration.service';
import { GraphVisualService } from 'src/app/services/graphVisual.service';

const debug = false;

const MULTIPLE_LINK_DISTANCE_EXTENSION = 50;
const DISTANCE_EXTENTION_BY_NODE_SIZE = 50;
const ALPHA_TARGET = 0;
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const MOVE_CLASS_TO_TOP_Y = 75;
const RDF_TYPE_LINK_DISTANCE = 200;

export class ForceDirectedGraph {
  public ticker: EventEmitter<d3.Simulation<GraphVisualNode, GraphVisualLink>> = new EventEmitter();
  public simulation: d3.Simulation<any, any>;
  public nodes: GraphVisualNode[] = [];
  public links: GraphVisualLink[] = [];


  constructor(nodes, links, options, configService: ConfigurationService, baseNodeUri: string) {
    this.nodes = nodes;
    this.links = links;
    this.simulation = d3.forceSimulation();
    // Connecting the d3 ticker to an angular event emitter
    const ticker = this.ticker;
    let baseNode = (this.nodes.find(n => n.uri == baseNodeUri) ? this.nodes.find(n => n.uri == baseNodeUri) : this.nodes[0]);
    this.simulation.on("tick", () => { this.fixNodeInCurrentPosition(baseNode, options.width / 2, options.height / 2) })
    this.simulation.nodes(this.nodes);

    this.updateForces(configService.d3ForceConfig, configService.nodeConfig, options, this.links, baseNodeUri);

    configService.d3ForceConfig$.subscribe(res => {
      this.updateForces(res, configService.nodeConfig, options, this.links, baseNodeUri);
    });

    configService.nodeConfig$.subscribe(res => {

      this.updateForces(configService.d3ForceConfig, res, options, this.links, baseNodeUri);
    });

    configService.d3SimulationToggle$.asObservable().subscribe(res => {
      this.updateForces(configService.d3ForceConfig, configService.nodeConfig, options, this.links, baseNodeUri);
    });


  }

  update(nodes: GraphVisualNode[],
    links: GraphVisualLink[],
    d3ConfigData: D3ForceConfig,
    nodeConfig: NodeConfig,
    options,
    baseNodeUri: string) {
    this.nodes = nodes;
    this.links = links;
    this.simulation.nodes(this.nodes);
    this.updateForces(d3ConfigData, nodeConfig, options, links, baseNodeUri);
    this.simulation.on("tick", null);
    let baseNode = this.nodes.find(n => n.uri == baseNodeUri);
    if (baseNode) {
      let x = baseNode.x;
      let y = baseNode.y;
      this.simulation.on("tick", () => {
        if (this.simulation.alpha() > 0.2) {
          this.fixNodeInCurrentPosition(baseNode, x, y)
        }
      }
      )
    }

  }

  private updateForces(d3ConfigData: D3ForceConfig, nodeConfig: NodeConfig, options, links, baseNodeUri) {
    this.simulation.stop();
    this.simulation.force("nodes", null);
    this.simulation.force("charge", null);
    this.simulation.force("links", null);
    this.simulation.force("d3X", null);
    this.simulation.force("d3Y", null);
    this.simulation.force("collide", null);
    if (d3ConfigData.simulationToogle) {
      this.simulation.alpha(0.6);
      this.simulation
        .force("links", this.forceLinks(d3ConfigData, nodeConfig, links))
        .force("d3X", d3.forceX((node: GraphVisualNode) => {
          return options.width / 2;
        }).strength(d3ConfigData.forceCenter))
        .force("d3Y", d3.forceY((node: GraphVisualNode) => {
          return options.height / 2;
        }).strength(d3ConfigData.forceCenter))
        .force("charge", this.forceCharge(d3ConfigData))
      this.simulation.restart();
    }
  }

  private moveClassesToTop() {
    this.nodes.forEach(node => {
      if (node.incomingNodes.find(iNode => iNode.predicate == RDF_TYPE)) {
        node.fy = MOVE_CLASS_TO_TOP_Y;
      }
    })
  }


  private forceCenter(opt) {
    return d3.forceCenter(opt.width / 2, opt.height / 2)
  }

  private forceCharge(d3ConfigData: D3ForceConfig) {
    return d3.forceManyBody().strength(-d3ConfigData.charge);
  }

  private forceCollide(nodeConfig: NodeConfig) {
    return d3.forceCollide().radius((node: GraphVisualNode) => {
      return node.getRadius(nodeConfig.outgoing_size, nodeConfig.incoming_size);
    }).strength(0.7)
  }

  private forceLinks(d3ConfigData: D3ForceConfig, nodeConfig: NodeConfig, links: GraphVisualLink[]) {
    return d3.forceLink(links)
      .id((d: GraphVisualNode) => d.uri)
  }

  private fixNodeInCurrentPosition(node: GraphVisualNode, x: number, y: number) {

    node.y = y;

    node.x = x;
  }

}
