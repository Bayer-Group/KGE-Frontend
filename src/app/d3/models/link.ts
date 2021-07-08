import { Node } from "./";

// Implementing SimulationLinkDatum interface into our custom Link class
export class Link implements d3.SimulationLinkDatum<Node> {
  // Optional - defining optional implementation properties - required for relevant typing assistance
  index?: number;

  // optinal label
  label: string;
  prettyLabel: string;

  // if there are multiple links that share the same target, each of them get an unique index
  duplicateTargetIndex?: number;
  // number of links that have the same target as this one
  duplicateTargetCount?: number;
  isOppositeDir?: boolean;
  hasOppositeDirSiblings?: boolean;

  oddSiblings?: number;
  evenSiblings?: number;

  highlightPath?: boolean;

  // Must - defining enforced implementation properties
  source: Node | string;
  target: Node | string;
  visibility: "hidden" | "visible" | "collapse";

  // from profile ranking_list, 1 - best, 10 - worst 
  rankingPriority: number;

  sourceIdx: number;
  targetIdx: number;

  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
}

export class LinkData {
  [key: string]: string;
}
