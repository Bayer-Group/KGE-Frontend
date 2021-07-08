import { DataObject } from '../d3/models';

export class Profile {
    showUnlabeledNodeName: boolean;
    showAllFromStart: boolean;
    graph: GraphProfile;
    customCss?: CustomCss[];
}

export class GraphProfile {
    node: NodeProfile;
    links: LinkProfile;
}

export class NodeProfile {
    data: NodeData;
    nodeImageShrinkFactor: number;
    increaseLabelSize: boolean;
    fetchFutherOutgoingNodesForUris: string[];
    formatUris: UriMap;
    userDefinedFormatUris: UriMap;
}

export class LinkProfile {
    allowList: string[];
    negativList: string[];
    rankingList: Ranking[];
    minLinks: number;
    maxLinks: number;

}

export class NodeData {
    showLabel: string[];
}

export class Ranking {
    k: string;
    v: number;
}

export class CustomCss {
    attributeName: string;
    attributes: CssAttributes;
}


export class CssAttributes {
    [key: string]: string;
}

export class UriMap {
    [key: string]: string;
}

