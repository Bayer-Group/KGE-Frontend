import { GraphVisualNode } from "./graphvisual/graphVisualNode";


export class GraphRelatedNode {
  predicate: string;
  uri: string;

  constructor(predicate: string, uri: string) {
    this.predicate = predicate
    this.uri = uri
  }
  getUri(): string {
    if (typeof this.uri != "string") {
      this.uri = (this.uri as unknown as GraphVisualNode).uri
    }
    return this.uri
  }

  getNode(): GraphVisualNode {
    return this.uri as unknown as GraphVisualNode
  }
}