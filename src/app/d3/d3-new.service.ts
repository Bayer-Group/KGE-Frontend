import { Injectable } from "@angular/core";
import { ForceDirectedGraph } from "./models/force-directed-graph-new";
import * as d3 from "d3";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { ConfigurationService } from "../services/configuration.service";

@Injectable()
export class D3Service {

  /** This service will provide methods to enable user interaction with elements
   * while maintaining the d3 simulations physics
   */
  constructor() { }

  colorScale(numOutgoingLinks: number, numAllOutgoingLinks: number[], isClass: boolean) {
    const scaleNormal = d3.scaleLinear<string>()
      .domain(d3.extent(numAllOutgoingLinks))
      .range(["#aec8d6", "#11394f"]);
    const scaleClass = d3.scaleLinear<string>()
      .domain(d3.extent(numAllOutgoingLinks))
      .range(["#ffe699", "#e6ac00"]);
    return isClass ? scaleClass(numOutgoingLinks) : scaleNormal(numOutgoingLinks);
  }

  /** A method to bind a pan and zoom behaviour to an svg element */
  applyZoomableBehaviour(svgElement, containerElement) {
    const svg = d3.select(svgElement);
    const container = d3.select(containerElement);

    const zoomed = () => {

      const transform = d3.event.transform;
      container.attr(
        "transform",
        "translate(" +
        transform.x +
        "," +
        transform.y +
        ") scale(" +
        transform.k +
        ")"
      );
      // console.log("zoomed scale= "+transform.k);
    };

    const zoom = d3.zoom().on("zoom", zoomed);
    // apply zoom and prevent zooming on double click
    svg.call(zoom).on("dblclick.zoom", null);
  }


  /** A method to bind a draggable behaviour to an svg element */
  applyDraggableBehaviour(element, node: GraphVisualNode, graph: ForceDirectedGraph) {
    const d3element = d3.select(element);
    function started() {
      /** Preventing propagation of dragstart to parent elements */
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) {
        graph.simulation.alphaTarget(0.1).restart();
      }

      d3.event.on("drag", dragged).on("end", ended);
      function dragged() {
        node.fx = d3.event.x;
        node.fy = d3.event.y;
      }
      function ended() {
        if (!d3.event.active) {
          graph.simulation.alphaTarget(0);
        }
        node.fx = null;
        node.fy = null;
      }
    }
    d3element.call(d3.drag().on("start", started));
  }

  /** The interactable graph we will simulate in this article
   * This method does not interact with the document, purely physical calculations with d3
   */
  getForceDirectedGraph(
    nodes: GraphVisualNode[],
    links: GraphVisualLink[],
    options,
    config: ConfigurationService,
    baseNodeUri: string
  ) {
    const graph = new ForceDirectedGraph(nodes, links, options, config, baseNodeUri);
    return graph;
  }
}
