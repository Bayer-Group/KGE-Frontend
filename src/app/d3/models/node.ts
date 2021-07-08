// Implementing SimulationNodeDatum interface into our custom Node class
export class Node implements d3.SimulationNodeDatum {
  // Optional - defining optional implementation properties - required for relevant typing assistance
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;

  uri: string;
  clicked?: boolean;
  data: NodeData;

  outgoingLinks?: number;
  incomingLinks?: number;
  // Weight based on outgoingLinks or incomingLinks
  weightedBy?: string[];
  sizeWeight?: number;
  colorWeight?: number;

  width?: number;
  height?: number;
  textY?: number;
  offsetX?: number;
  offsetY?: number;
  fontSize?: string;
  fontWeight?: number;
  imageOffsetXY?: number;

  color?: string;
  baseColor?: string;

  imageSize?: number;
  imageRadius?: number;
  visibility: "hidden" | "visible";
  toolTipInfo: string;

  linkList: Array<{ linkIndex: number, biLink: boolean }> = [];

  constructor(uri) {
    this.uri = uri;
  }
}

export class NodeData {
  mainLabel: string;
  [key: string]: string | DataObject;
}

export interface DataObject {
  prettyLabel: string;
  values: [string];
}
