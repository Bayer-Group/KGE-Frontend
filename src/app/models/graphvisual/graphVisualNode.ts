
import tinycolor from 'tinycolor2';
import { GraphRelatedNode } from '../GraphRelatedNode';

export class GraphVisualNode implements d3.SimulationNodeDatum {

  nodeLabel: string;
  uri: string;
  outgoingNodes: GraphRelatedNode[];
  incomingNodes: GraphRelatedNode[];
  hiddenOutgoingNodes: GraphRelatedNode[];
  hiddenIncomingNodes: GraphRelatedNode[];
  deletedOutgoingNodes: GraphRelatedNode[] = [];
  deletedIncomingNodes: GraphRelatedNode[] = [];
  data: GraphVisualNodeDataNew[];
  isClass: boolean;
  image: string[];

  // from d3
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;

  getColor(outgoing_color: boolean, incoming_color: boolean): string {
    if (this.isClass) return "#ffcd15";
    else {
      let baseColor = "#11394f";
      if (outgoing_color) {
        baseColor = tinycolor(baseColor).lighten(this.outgoingNodes.length * 2);
      }
      if (incoming_color) {
        baseColor = tinycolor(baseColor).lighten(this.incomingNodes.length * 2);
      }
      return baseColor;
    }
  }

  get uriNamespace() {
    let array = this.uri.split(/\/(?=[^\/]+$)/)
    return array[0];
  }

  get uriLocal() {
    let array = this.uri.split(/\/(?=[^\/]+$)/)
    return array[1];
  }

  // isHidden: boolean;
  // maybe tooltip

  getRadius(outgoing_size_show: boolean, incoming_size_show: boolean) {

    let countOutgoingLinksNr = 0
    let incommingLinksNr = 0
    if (this.outgoingNodes != undefined) {
      countOutgoingLinksNr = this.outgoingNodes.length
    }
    if (this.incomingNodes != undefined) {
      incommingLinksNr = this.incomingNodes.length
    }
    let linkSum = 2;

    if (outgoing_size_show) {
      linkSum += countOutgoingLinksNr
    }
    if (incoming_size_show) {
      linkSum += incommingLinksNr
    }
    // TODO remove hard-coded values
    return Math.log2(linkSum) * 15;
  }
  showLinksToNode(node: GraphRelatedNode) {
    this.hiddenOutgoingNodes = this.hiddenOutgoingNodes.filter(n => n.uri != node.uri)
    this.outgoingNodes.push(node)
  }
  hideLinksToNode(node: GraphRelatedNode) {
    this.outgoingNodes = this.outgoingNodes.filter(n => n.uri != node.uri)
    this.hiddenOutgoingNodes.push(node)
  }
  showLinksFromNode(node: GraphRelatedNode) {
    this.hiddenIncomingNodes = this.hiddenIncomingNodes.filter(n => n.uri != node.uri)
    this.incomingNodes.push(node)
  }
  hideLinksFromNode(node: GraphRelatedNode) {
    this.incomingNodes = this.incomingNodes.filter(n => n.uri != node.uri)
    this.hiddenIncomingNodes.push(node)
  }
  hideLinksFromDeletedNode(node: GraphRelatedNode) {
    this.deletedIncomingNodes = this.deletedIncomingNodes.filter(n => n.uri != node.uri)
    this.hiddenIncomingNodes.push(node)
  }
  hideLinksToDeletedNode(node: GraphRelatedNode) {
    this.deletedOutgoingNodes = this.deletedOutgoingNodes.filter(n => n.uri != node.uri)
    this.hiddenOutgoingNodes.push(node)
  }

}



export class GraphVisualNodeDataNew {
  predicate: string;
  value: string;
}