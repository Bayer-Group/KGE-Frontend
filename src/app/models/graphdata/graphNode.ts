import { GraphRelatedNode } from '../GraphRelatedNode';

export class GraphNode {
    uri: string;
    outgoingNodes: GraphRelatedNode[];
    incomingNodes: GraphRelatedNode[];
    data: GraphNodeData[];

}
export class GraphNodeData {
    predicate: string;
    value: string;
}

