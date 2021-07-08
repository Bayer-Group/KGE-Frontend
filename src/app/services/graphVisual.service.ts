import { Injectable } from '@angular/core';
import { GraphDataService } from "./graphdata.service"
import { Subject } from 'rxjs/internal/Subject';
import { GraphVisualData } from "../models/graphvisual/graphVisualData";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { RequestTypeEnum } from './backend.api.service';
import { Profile } from '../models/profile';
import { ProfileService } from './profile.service';

import appConfig from "src/app/config_default.json";
import { GraphRelatedNode } from '../models/GraphRelatedNode';
import { FilterOverLimitNodeService } from './filterOverLimitNode.service';
import { FilterBetweenLimitNodeService } from './filterBetweenLimitNode.service';
import { ConfigurationService } from './configuration.service';
import { PathConfigData } from '../dialogs/pathconfig/pathconfig.dialog';
import { GraphParserService } from './graphParser.service';
import { GraphDataNew } from '../models/graphdata/graphdata';


// export const imageMapping = {
//     "https://pid.bayer.com/kos/19050/435897": "hasIcon",
//     "http://10.122.106.18:3000/hasPicture": "hasPicture"
// }

const unlabeled_node = "Unlabeled Node";

@Injectable({
    providedIn: "root"
})
export class GraphVisualService {
    private _graphVisualData: GraphVisualData;
    private _graphVisualData$: Subject<GraphVisualData> = new Subject();
    private _graphVisualAdditionalNew$: Subject<GraphVisualData> = new Subject();
    private _graphVisualRandomData$: Subject<GraphVisualData> = new Subject();
    private _nodeDictionary: Map<string, GraphVisualNode> = new Map();
    private _linkDictionary: Map<string, GraphVisualLink> = new Map();

    private _currentBaseUri: string = ""
    private _currentType: RequestTypeEnum
    private _profile: Profile = null;
    private _highlightedNodes: string[] = [];
    private _highlightedLinks: string[] = [];

    public highlightedPath = false;
    private limitDirectShow = appConfig.limit_direct_show;
    private limitWarning = appConfig.limit_warning;
    private useNodeLimit = true;

    constructor(private graphDataService: GraphDataService,
        private FilterBetweenLimitNodeService: FilterBetweenLimitNodeService,
        private filterOverLimitNodeService: FilterOverLimitNodeService,
        private parser: GraphParserService,
        private profileService: ProfileService,
        private ConfigService: ConfigurationService,
    ) {


        this.profileService.profileConfig$.subscribe(profile => {
            this._profile = profile;
        });

        /**
         * this subscriber would be call by click the plot button
         */
        this.graphDataService.graphData$.subscribe(graphData => {
            this.profileService.profileConfig$.subscribe(profile => {
                this.buildGraph(profile, graphData, !profile.showAllFromStart);
                this.updateDictionary();
                this.clearGraphByProfile();
                this.updateVisualGraph()
                this.updateNoneAdditionalNode();
            });
        })

        /**
         * this subscriber would be call by click the feal lucky button
         */
        this.graphDataService.graphRandomNode$.subscribe(graphData => {
            this._currentType = RequestTypeEnum.ALL
            this.profileService.profileConfig$.subscribe(profile => {
                this.buildGraph(profile, graphData, !profile.showAllFromStart);
                this.updateDictionary();
                this.clearGraphByProfile();
                this.updateVisualGraph();
                this.updateNoneAdditionalNode();
            });
        })

        /**
         * this subscriber would be call in path "globalpath" mode by click the plot button
         * IMPORTANT not local path mode. For the local path see shortestPath.service
         */
        this.graphDataService.graphDataGlobalPath$.subscribe(graphData => {
            this.profileService.profileConfig$.subscribe(profile => {
                this.buildGraph(profile, graphData, true);
                this.updateDictionary();
                this.updateVisualGraph()
            });
        })


        /**
         * this subscriber would be call after you open the graph generator in the config-bar
         * by click the plot button
         */
        this.graphDataService.graphDataGenerateByNquads$.subscribe(graphData => {
            this._currentType = RequestTypeEnum.ALL
            this.profileService.profileConfig$.subscribe(profile => {
                this.buildGraph(profile, graphData, !profile.showAllFromStart);
                this.updateDictionary();
                this.clearGraphByProfile();
                this.updateVisualGraph();
                this.updateNoneAdditionalNode();
            });
        })

        /**
         * this subscriber get called by double click on the node or on the click 
         * of the plus symbole button on the node also it get called at the
         * setting showAllFromStart variable is false
         */
        this.graphDataService.graphDataAdditional$.subscribe(graphData => {
            this.ConfigService.d3ForceConfig.simulationToogle = true;
            let newGraphData = this.parser.parseToGraphDataVisual(graphData, true,
                this._currentType, this.baseNodeUri, this.graphDataService.nodeDictionary);
            this._graphVisualData = this.parser.mergeGraphData(newGraphData, this._graphVisualData
                , this._nodeDictionary, this._linkDictionary);

            this._nodeDictionary = this.parser.nodeDictionary;
            this._linkDictionary = this.parser.linkDictionary;

            if (this._currentType === RequestTypeEnum.OUTGOING ||
                this.profileService.profileName == "colid" && this._currentType === RequestTypeEnum.ALL) {
                this.showOutgoingNodes(this._currentBaseUri)
            } else {
                this.showIncomingNodes(this._currentBaseUri)
            }
        })

        /**
         * if the number of nodes between the limits then the user has
         * to select some nodes and press plot
         */
        this.FilterBetweenLimitNodeService.getOutputDataObservable().subscribe(data => {
            let nodes = data.uris.map(uri => this._nodeDictionary.get(uri))
            this.showNodes(nodes)
        })

        /**
         * if the number of nodes over the max limit then the user has
         * to select some node by the autocomplete or the list and press plot
         */
        this.filterOverLimitNodeService.getOutputDataObservable().subscribe(data => {
            let nodes = data.uris.map(uri => this._nodeDictionary.get(uri))
            this.showNodes(nodes)
        })
    }

    /**
     * build a visual graph by using profile and graphData
     * @param profile Profile
     * @param graphData GraphDataNew
     * @param showAllFromStart boolean
     */
    buildGraph(profile: Profile, graphData: GraphDataNew, showAllFromStart: boolean) {
        if (profile != null) {
            this._profile = profile;
            this.parser.SetProfile(profile);
            this.reset()
        }

        this.ConfigService.d3ForceConfig.simulationToogle = true;
        graphData.nodes = this.parser._mergeUnique(graphData.nodes, [])

        this._graphVisualData = this.parser.parseToGraphDataVisual(graphData, showAllFromStart,
            this._currentType, this.baseNodeUri, this.graphDataService.nodeDictionary);
    }

    /**
     * fetch additional information by a giving baseUri for a graph
     */
    updateNoneAdditionalNode() {
        if (!this._profile.showAllFromStart && this._currentType != RequestTypeEnum.ALL) {
            this.fetchAdditional(this._currentBaseUri, RequestTypeEnum.OUTGOING, this.profileService.profileName == "colid")
        }
    }

    /**
     * call fetch methode of graphDataService to 
     * generate a visual graph by a giving string of nquads
     * @param input nquads string parameter
     */
    fetchGenerateGraphByNquads(input: string) {
        this.graphDataService.fetchGenerateGraphByNquads(input)
    }

    /**
     * call normal fetch methode of graphDataService for a giving node uri called 
     * baseUri configurate by requestType
     * @param baseUri string
     * @param type RequestTypeEnum
     * @param isColid boolean
     */
    fetch(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        if (type === RequestTypeEnum.ALL) {
            this._currentBaseUri = "*";
        } else {
            this._currentBaseUri = baseUri;
        }

        this._currentType = type
        this.graphDataService.fetch(baseUri, type, isColid)
    }


    /**
     * call fetch methode for a random node of graphDataService to 
     * generate a visual graph *feel lucky button*
     * @param noVisualGraph boolean
     */
    fetchRandom(noVisualGraph: boolean) {
        this._currentType = RequestTypeEnum.RANDOMNODE
        this.graphDataService.fetchRandomNode(this._currentType, noVisualGraph)
    }

    /**
     * call fetch methode for a global path of graphDataService to
     * generate a visual graph
     * @param config PathConfigData
     * @param fromUri string
     * @param toUri string
     */
    fetchGlobalPathGV(config: PathConfigData, fromUri: string, toUri: string) {
        this._currentType = RequestTypeEnum.GLOBALPATH
        this._currentBaseUri = "*"
        this.graphDataService.fetchGlobalPath(config, fromUri, toUri, this.profileService.profileName == "colid")
    }

    /**
     * call fetch methode from graphDataService to get all 
     * neighbours graph information of the baseUri node by observe the given
     * requestType
     * @param baseUri string
     * @param type RequestTypeEnum
     * @param isColid boolean
     */
    fetchAdditional(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        this._currentBaseUri = baseUri;
        this._currentType = type
        this.graphDataService.fetchAdditional(baseUri, type, isColid)
        // setTimeout(() => {this.openOutgoingNodes(this._nodeDictionary.get(baseUri));}, 10000);
    }

    isHighlightedNode(uri: string): boolean {
        return this._highlightedNodes.some(h => h === uri);
    }

    highlightSingleNode(uri: string) {
        this.highlightedPath = false;
        this._highlightedNodes = [uri];
        this._highlightedLinks = [];
    }

    highlightSingleLink(uri: string) {
        this.highlightedPath = false;
        this._highlightedNodes = [];
        this._highlightedLinks = [uri];
    }

    highlightPath(nodes: GraphVisualNode[], links: GraphVisualLink[]) {

        this.highlightedPath = true;
        this._highlightedNodes = []
        nodes.forEach(n => {
            this._highlightedNodes.push(n.uri)
        })

        this._highlightedLinks = []
        links.forEach(l => {
            this._highlightedLinks.push(`link_${l.predicate}_${l.index}`)
        })
    }

    isHighlightedLink(uri: string): boolean {
        return this._highlightedLinks.some(h => h === uri);
    }

    get baseNodeUri() {
        return this._currentBaseUri
    }

    get highlightedLinks() {
        return this._highlightedLinks;
    }

    set highlightedLinks(links: string[]) {
        this._highlightedLinks = links;
    }

    get highlightedNodes() {
        return this._highlightedNodes;
    }

    set highlightedNodes(nodes: string[]) {
        this._highlightedNodes = nodes;
    }

    get graphVisualData() {
        return this._graphVisualData;
    }

    get graphVisualData$() {
        return this._graphVisualData$.asObservable();
    }

    get graphVisualAdditionalNew$() {
        return this._graphVisualAdditionalNew$.asObservable();
    }

    get graphVisualRandomData$() {
        return this._graphVisualRandomData$.asObservable();
    }

    get nodeDictionary() {
        return this._nodeDictionary;
    }
    get linkDictionary() {
        return this._linkDictionary;
    }

    private arrayOrEmpty(arr: any[]) {
        return arr ? arr : []
    }

    /**
     * hide link on visual graph
     * @param link GraphVisualLink
     */
    hideLink(link: GraphVisualLink) {
        this.graphVisualData.hideLinks([link], this._nodeDictionary)
        this.updateVisualGraph()

    }

    /**
     * show link on visual graph
     * unhidde node if hide connected with the link
     * on source or target
     * @param hiddenLinks GraphVisualLink
     */
    showLink(hiddenLinks: GraphVisualLink) {
        let sourceNode: string = this.parser.getSourceUri(hiddenLinks)
        let targetNode: string = this.parser.getTargetUri(hiddenLinks)
        if (!this.graphVisualData.isNode( sourceNode)) {
            this.graphVisualData.showHiddenNode(this.nodeDictionary.get( sourceNode))
        }
        if (!this.graphVisualData.isNode( targetNode)) {
            this.graphVisualData.showHiddenNode(this.nodeDictionary.get( targetNode))
        }
        this.graphVisualData.showLinks([hiddenLinks], this._nodeDictionary)
        this.updateVisualGraph()

    }

    /**
     * hide single node on visual graph
     * @param node GraphVisualNode
     */
    hideNode(node: GraphVisualNode) {
        this.graphVisualData.hideNode(node)
        let linksToHide: GraphVisualLink[] = []
        node.outgoingNodes.forEach(outN => {
            let relevantLink: GraphVisualLink = this._linkDictionary.get(node.uri + outN.predicate + outN.uri)
            linksToHide.push(relevantLink)
        })

        node.incomingNodes.forEach(inN => {
            let relevantLink: GraphVisualLink = this._linkDictionary.get(inN.uri + inN.predicate + node.uri)
            linksToHide.push(relevantLink)
        })
        this.graphVisualData.hideLinks(linksToHide, this._nodeDictionary)
        this.updateVisualGraph()
    }

    /**
     * delete link on visual graph
     * @param link GraphVisualLink
     */
    deleteLink(link: GraphVisualLink) {
        this.graphVisualData.deleteLinks([link], this.nodeDictionary)
        this.updateVisualGraph()
    }

    /**
     * delete node on visual graph
     * @param node GraphVisualNode
     */
    deleteNode(node: GraphVisualNode) {
        this.graphVisualData.deleteNode(node)
        let linksToDelete: GraphVisualLink[] = []

        node.outgoingNodes.forEach(outN => {
            let relevantLink: GraphVisualLink = this._linkDictionary.get(node.uri + outN.predicate + outN.uri)
            linksToDelete.push(relevantLink)
        })

        node.incomingNodes.forEach(inN => {
            let relevantLink: GraphVisualLink = this._linkDictionary.get(inN.uri + inN.predicate + node.uri)
            linksToDelete.push(relevantLink)
        })

        this.graphVisualData.deleteLinks(linksToDelete, this._nodeDictionary)
        this.updateVisualGraph()
    }

    /**
     * add giving nodes to graph visual data
     * 
     * @param nodes GraphVisualNode
     */
    showNodes(nodes: GraphVisualNode[]) {

        nodes.forEach(node => {

            if (this.graphVisualData.isHiddenNode(node.uri)) {
                this.graphVisualData.showHiddenNode(node)
            } else if (this.graphVisualData.isDeletedNode(node.uri)) {
                this.graphVisualData.showDeletedNode(node)
            }
        })
        let linksToShow: GraphVisualLink[] = []
        nodes.forEach(node => {
            node.hiddenOutgoingNodes.forEach(hiddenON => {
                let relevantLink: GraphVisualLink = this._linkDictionary.get(node.uri + hiddenON.predicate + hiddenON.uri)
                //TODO: find the logical error
                if (relevantLink === undefined) {
                    relevantLink = this.graphVisualData.hiddenLinks.find(l => l.source === node.uri && l.predicate === hiddenON.predicate && l.target === hiddenON.uri)


                    if (relevantLink === undefined) {
                        let link: GraphVisualLink = {
                            predicate: hiddenON.predicate, source: node.uri, target: hiddenON.uri,
                            isType: this.parser.isClassPredicate(hiddenON.predicate), label: this.parser.getStringFromUri(hiddenON.predicate),
                            rank: this.parser.getLinkRank(hiddenON.predicate)
                        }
                        this.graphVisualData.hiddenLinks.push(link)
                        this._linkDictionary.set(node.uri + hiddenON.predicate + hiddenON.uri, link)
                        relevantLink = link
                    }

                }
                if (!this.graphVisualData.isLink(relevantLink)) {
                    linksToShow.push(relevantLink)
                }

            })
            node.hiddenIncomingNodes.forEach(hiddenIN => {

                if (this.graphVisualData.isNode(hiddenIN.uri)) {

                    let relevantLink: GraphVisualLink = this._linkDictionary.get(hiddenIN.uri + hiddenIN.predicate + node.uri)
                    //TODO: find the logical error
                    if (relevantLink === undefined) {
                        relevantLink = this.graphVisualData.hiddenLinks.find(l => l.source === hiddenIN.uri && l.predicate === hiddenIN.predicate && l.target === node.uri)
                    }

                    if (!this.graphVisualData.isLink(relevantLink)) {
                        linksToShow.push(relevantLink)
                    }
                }
            })
            node.deletedOutgoingNodes.forEach(deleteON => {
                let relevantLink: GraphVisualLink = this._linkDictionary.get(node.uri + deleteON.predicate + deleteON.uri)
                //TODO: find the logical error
                if (relevantLink === undefined) {
                    relevantLink = this.graphVisualData.deletedLinks.find(l => l.source === node.uri && l.predicate === deleteON.predicate && l.target === deleteON.uri)


                    if (relevantLink === undefined) {
                        let link: GraphVisualLink = {
                            predicate: deleteON.predicate, source: node.uri, target: deleteON.uri,
                            isType: this.parser.isClassPredicate(deleteON.predicate), label: this.parser.getStringFromUri(deleteON.predicate),
                            rank: this.parser.getLinkRank(deleteON.predicate)
                        }
                        this.graphVisualData.deletedLinks.push(link)
                        this._linkDictionary.set(node.uri + deleteON.predicate + deleteON.uri, link)
                        relevantLink = link
                    }

                }
                if (!this.graphVisualData.isLink(relevantLink)) {
                    linksToShow.push(relevantLink)
                }
            })
            node.deletedIncomingNodes.forEach(deleteIN => {
                if (this.graphVisualData.isNode(deleteIN.uri)) {
                    let relevantLink: GraphVisualLink = this._linkDictionary.get(deleteIN.uri + deleteIN.predicate + node.uri)
                    //TODO: find the logical error
                    if (relevantLink === undefined) {
                        relevantLink = this.graphVisualData.deletedLinks.find(l => l.source === deleteIN.uri && l.predicate === deleteIN.predicate && l.target === node.uri)
                    }
                    if (!this.graphVisualData.isLink(relevantLink)) {
                        linksToShow.push(relevantLink)
                    }
                }
            })
        })


        this.graphVisualData.showLinks(linksToShow, this._nodeDictionary)
        nodes.forEach(n => {
            this.clearNodeFromDouble(n)
        })

        this.updateVisualGraph()

    }

    /**
     * open nodes there are connected over 
     * outgoing links
     * @param nodeUri string
     */
    showOutgoingNodes(nodeUri: string) {
        let node = this.nodeDictionary.get(nodeUri)
        const limitWarning = appConfig.limit_warning
        let nodesToShow: GraphVisualNode[] = []

        node.hiddenOutgoingNodes.forEach(hON => {
            let outNode = this.nodeDictionary.get(hON.uri)
            if (!nodesToShow.find(n => n === outNode)) {
                nodesToShow.push(outNode)
            }
        })

        if (nodesToShow.length <= this.limitDirectShow) {
            nodesToShow.push(node)
            this.showNodes(nodesToShow)

        } else if (nodesToShow.length <= limitWarning) {
            this.FilterBetweenLimitNodeService.setData({
                show: true,
                node: node,
                nodeDictionary: this._nodeDictionary,
                isOutgoing: true
            })
        } else {
            this.filterOverLimitNodeService.setData({
                show: true,
                node: node,
                nodeDictionary: this._nodeDictionary,
                linkDictionary: this._linkDictionary,
                isOutgoing: true
            })

        }
    }

    /**
     * open nodes there are connected over 
     * incoming links
     * @param nodeUri string
     */
    showIncomingNodes(nodeUri: string) {
        let node = this.nodeDictionary.get(nodeUri)
        let nodesToShow: GraphVisualNode[] = []

        node.hiddenIncomingNodes.forEach(hIN => {
            let inNode = this.nodeDictionary.get(hIN.uri)
            if (!nodesToShow.find(n => n === inNode)) {
                nodesToShow.push(inNode)
            }
        })
        //TODO: Change this after the delete link list integrated into the frontend
        /* node.deletedIncomingNodes.forEach(dIN => {
            let delNode = this.nodeDictionary.get(dIN.uri)
            if (!nodesToShow.find(n => n === delNode)) {
                nodesToShow.push(delNode)
            }
        }) */

        if (nodesToShow.length <= this.limitDirectShow || !this.useNodeLimit) {
            nodesToShow.push(node)
            this.showNodes(nodesToShow)

        } else if (nodesToShow.length <= this.limitWarning || !this.useNodeLimit) {
            this.FilterBetweenLimitNodeService.setData({
                show: true,
                node: node,
                nodeDictionary: this._nodeDictionary,
                isOutgoing: false
            })
        } else {
            this.filterOverLimitNodeService.setData({
                show: true,
                node: node,
                nodeDictionary: this._nodeDictionary,
                linkDictionary: this._linkDictionary,
                isOutgoing: false
            })

        }
    }

    clearNodeFromDouble(node: GraphVisualNode): GraphVisualNode {
        node.incomingNodes = this.clearRelatedNodeFromDouble(node.incomingNodes)
        node.outgoingNodes = this.clearRelatedNodeFromDouble(node.outgoingNodes)
        node.hiddenIncomingNodes = this.clearRelatedNodeFromDouble(node.hiddenIncomingNodes)
        node.hiddenOutgoingNodes = this.clearRelatedNodeFromDouble(node.hiddenOutgoingNodes)
        node.deletedIncomingNodes = this.clearRelatedNodeFromDouble(node.deletedIncomingNodes)
        node.deletedOutgoingNodes = this.clearRelatedNodeFromDouble(node.deletedOutgoingNodes)
        return node
    }

    clearRelatedNodeFromDouble(relatedNode: GraphRelatedNode[]): GraphRelatedNode[] {
        let nodeList: GraphRelatedNode[] = []
        relatedNode.forEach(rNode => {
            if (!nodeList.find(nl => {

                return nl.predicate == rNode.predicate && nl.uri == rNode.uri
            })) {
                nodeList.push(rNode)
            }

        });

        return nodeList
    }

    /**
     * clear graph visual data by the propertys of profiles     * 
     * profiles are located in ./Assets/Profile/*.profile.json
     */
    clearGraphByProfile() {
        if (this._currentType != RequestTypeEnum.ALL
            || this.profileService.profileName == "colid") {

            let linksToHide: GraphVisualLink[] = []
            let linksToShow: GraphVisualLink[] = []

            const allowList: string[] = this.arrayOrEmpty(this._profile.graph.links.allowList);
            const negativList: string[] = this.arrayOrEmpty(this._profile.graph.links.negativList);
            let minLinks: number = this._profile.graph.links.minLinks;
            let maxLinks: number = this._profile.graph.links.maxLinks;

            if (!minLinks) {
                minLinks = Number.POSITIVE_INFINITY;
            }
            if (!maxLinks) {
                maxLinks = Number.POSITIVE_INFINITY;
            }
            let tempLinkList: GraphVisualLink[] = []
            this._graphVisualData.links.forEach(l => {
                if (allowList.includes(l.predicate) && linksToShow.length <= maxLinks) {
                    linksToShow.push(l)
                }
                if (negativList.includes(l.predicate)) {
                    linksToHide.push(l)
                }
            })

            tempLinkList = this._graphVisualData.links.filter(l => l != linksToShow.find(lTS => lTS == l) && l != linksToHide.find(lTH => lTH == l))
            tempLinkList.forEach(tL => {
                if (linksToShow.length < minLinks && linksToShow.length < maxLinks) {
                    linksToShow.push(tL)
                } else {
                    linksToHide.push(tL)
                }
            })

            this.graphVisualData.hideLinks(linksToHide, this.nodeDictionary)
            // TODO: This shouldn't be necessary, there are problems somewhere with incomming Links
        }
    }

    /**
     * update dictionarys _nodeDictionary*,_linkDictionary with 
     * current graph visual datas
     */
    private updateDictionary() {
        this._graphVisualData.nodes.forEach(node => this._nodeDictionary.set(node.uri, node))
        this._graphVisualData.hiddenNodes.forEach(node => this._nodeDictionary.set(node.uri, node));
        this._graphVisualData.links.forEach(link => {
            this._linkDictionary.set(this.parser.getSourceUri(link) + link.predicate + this.parser.getTargetUri(link), link)
        })
    }

    /**
     * clear graph visual data links,nodes,
     * hiddenLinks,hiddeNodes of duplicate entries
     */
    clearGraph() {
        let links: GraphVisualLink[] = []
        this.graphVisualData.links.forEach(l => {
            if (!links.find(nl => this.graphVisualData.areEqualLinks(nl, l))) {
                links.push(l)
            }
        })
        this.graphVisualData.links = links

        let hiddenLinks: GraphVisualLink[] = []
        this.graphVisualData.hiddenLinks.forEach(l => {
            if (!hiddenLinks.find(nl => this.graphVisualData.areEqualLinks(nl, l))) {
                hiddenLinks.push(l)
            }
        })
        this.graphVisualData.hiddenLinks = hiddenLinks

        let nodes: GraphVisualNode[] = []
        this.graphVisualData.nodes.forEach(n => {
            if (!nodes.find(nn => n.uri === nn.uri)) {
                nodes.push(n)
            }
        })
        this.graphVisualData.nodes = nodes

        let hiddenNodes: GraphVisualNode[] = []
        this.graphVisualData.hiddenNodes.forEach(n => {
            if (!hiddenNodes.find(nn => n.uri === nn.uri)) {
                hiddenNodes.push(n)
            }
        })
        this.graphVisualData.hiddenNodes = hiddenNodes
    }

    /**
     * sort all node property in an alphabet order
     * for all visual graph nodes
     */
    sortNodeData() {
        this._graphVisualData.nodes.forEach(n => {
            n.data.sort((a, b) => b.predicate.localeCompare(a.predicate))
        })
    }

    updateVisualGraph() {
        this.clearGraph()
        this.sortNodeData()
        this._graphVisualData$.next(this._graphVisualData)
    }

    /**
     * set all
     * graph variable to initial values
     */
    reset() {
        this._graphVisualData = null
        this._nodeDictionary = new Map();
        this._linkDictionary = new Map();
        this._highlightedNodes = [];
        this._highlightedLinks = [];
    }
}