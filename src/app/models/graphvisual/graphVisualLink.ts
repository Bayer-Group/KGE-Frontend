import { GraphVisualNode } from "./graphVisualNode";

export class GraphVisualLink implements d3.SimulationLinkDatum<GraphVisualNode> {
    predicate: string;
    source: string | GraphVisualNode;
    target: string | GraphVisualNode;
    label: string;
    isType: boolean;

    // maybe tooltip
    // needed to calculate the shortest path in regarding priority of links
    rank: number;
    duplicateTargetIndex?: number;
    evenSiblings?: number;
    oddSiblings?: number;
    isOppositeDir?: boolean;
    duplicateTargetCount?: number;
    hasOppositeDirSiblings?: boolean;

    //shighlightPath?: boolean;

    //d3
    index?: number;
}

export class SidebarLink {
    label: string;
    predicate: string;
    node: SidebarLinkNode[];
}

export class SidebarLinkNode {
    label: string;
    checked: boolean;
    linkUri: string;
}

export class SidebarOutInLink {
    label: string;
    link: SidebarLink[];
}

