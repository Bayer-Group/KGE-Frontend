import { TripleStoreApiService, BindingValue, TripleStoreApiResult } from "./triplestore.api.service";
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import { Link } from "./../d3/models/link";
import { Node } from "./../d3/models/node";
import { Subject } from "rxjs";
import { Injectable } from "@angular/core";
import { PathConfigData } from "../dialogs/pathconfig/pathconfig.dialog";
import appConfig from "src/app/config_default.json";
import { DBConfigService, VirtualGraph, DBPath } from './dbconfig.service';
import { DBItem } from "../dialogs/plotconfig/plotconfig.dialog";
import { FilterOverLimitNodeService, FilterOverLimitNodeWindowData } from "./filterOverLimitNode.service";

export class GraphData {
    nodes: Node[];
    links: Link[];
}

const debug = false;

interface LinkData {
    source: string;
    target: string;
    links: Link[];
    hasLinksWithOppositDir: boolean;
}

@Injectable({
    providedIn: "root"
})
export class TripleStoreService {

    /**
     * 
     * @param store 
     * @param searchOutgoingAllService 
     * @param searchOutgoingMediumService 
     * @param dbConfig 
     */
    constructor(private store: TripleStoreApiService,
        private searchOutgoingAllService: FilterOverLimitNodeService,
        private dbConfig: DBConfigService) {
        this.searchOutgoingAllService.getOutputDataObservable().subscribe((res: FilterOverLimitNodeWindowData) => {
            this.highlightPathLinks();
        })


    }

    private progressSpinnerTracker = new BehaviorSubject<boolean>(false);
    private currentRequest: Subscription;
    private showAllFromStart = false;
    private showAllFromStart$: Observable<boolean>;

    private graphDataTracker = new Subject<GraphData>();
    private graphData: GraphData = { nodes: [], links: [] }

    public availableDBs = [] as DBItem[];
    public selectedDBs = [] as DBItem[];
    public selectedVirtualGraphs = [] as VirtualGraph[];

    // array contains all links that are highlighted to show the currently displayed path between two nodes
    private pathLinks: BindingValue[] = [];


    /**
     * 
     * @param showAll$ 
     */
    setShowAllFromStart(showAll$: Observable<boolean>) {
        this.showAllFromStart$ = showAll$;
        this.showAllFromStart$.subscribe(value => this.showAllFromStart = value)
    }

    /**
     * 
     * @returns 
     */
    getProgressSpinnerTracker(): Observable<boolean> {
        return this.progressSpinnerTracker.asObservable();
    }

    /**
     * 
     */
    getGraphDataTracker(): Observable<GraphData> {
        return this.graphDataTracker.asObservable();
    }

    /**
     * 
     * @param graph 
     */
    setGraphDataTracker(graph: GraphData) {
        this.graphDataTracker.next(graph);
    }

    /**
     * 
     * @returns 
     */
    getGraph() {
        return this.graphData;
    }

    /**
     * 
     * @param data 
     */
    emitGraphDataTracker(data: GraphData) {
        this.graphData = data;
        this.graphDataTracker.next(data);
    }

    /**
     * 
     * @param dbs 
     */
    setSelectedDBs(dbs: DBItem[]) {
        this.selectedDBs = dbs;
        this.store.selectedDBs = dbs;
    }

    /**
     * 
     * @param dbs 
     */
    setAvailableDBs(dbs: DBItem[]) {
        this.availableDBs = dbs
        this.store.availableDBs = dbs
    }

    /**
     * 
     * @param graphs 
     */
    setSelectedVirtualGraphs(graphs: VirtualGraph[]) {
        // console.log("setVirtualGraphs")
        this.selectedVirtualGraphs = graphs;
        this.store.selectedVirtualGraphs = graphs;
    }

    /**
     * Sends the selected node to the backend and receives a list of all directly related nodes and their links. It then calls functions to
     * initialize the most important properties and informs the graphDataTracker, which in turn will alert every component that subscribed
     * and waits for a graphData array.
     * param {selected node, which will be displayed} node
     * @param nodeURI 
     */
    fetchInitialGraphData(nodeURI) {
        // show the loading spinner
        this.progressSpinnerTracker.next(true);

        // const emptyGraphData: GraphData = {nodes: [], links: []}

        this.currentRequest = this.store.getTripleStoreResource(nodeURI, this.dbConfig.dbConfigRequest).subscribe(res => {
            this.progressSpinnerTracker.next(false);
            if (this.showAllFromStart) {
                this.initializeGraph(res)
            } else {
                let startNode: Node = res.nodes.find(node => node.uri == nodeURI)
                if (startNode) {
                    let basicRes: TripleStoreApiResult = { nodes: [startNode], links: [] }
                    this.initializeGraph(basicRes)

                } else console.log("some error on fetchInitialGraphData")
                this.limitedAdditionalDataInflow(nodeURI, res, startNode)
            }


            // this.initializeGraph(res)
        }, (err) => {
            this.progressSpinnerTracker.next(false);
        });
    }

    /**
     * 
     * @param res 
     */
    private initializeGraph(res) {
        this.graphData = res;
        // sets the count for incoming/outgoing links for every node
        this.initNodeLinkCount();
        // sets an index for every link if there are mutliple that have the same target and source
        this.initDuplicateTargetIndex();
        // set initial node (first node as clicked)
        // this.graphData.nodes[0].clicked = true;
        this.sortLinksByDuplicateTargetIndex(res.links);
        // console.log("send request to graphDataTracker")
        this.graphDataTracker.next(res);
        this.highlightPathLinks();
    }

    /**
     * Sends a request to receive a random node as the starting node and pushes it to the graphDataTracker observable.
     */
    getRandomInitalGraphData() {
        this.progressSpinnerTracker.next(true);
        this.currentRequest = this.store.getTripleStoreResourceRandom(this.dbConfig.dbConfigRequest).subscribe(res => {
            console.log("getRandomInitalGraphData")
            console.log(res)
            this.graphData = res;
            this.initNodeLinkCount();
            this.initDuplicateTargetIndex();
            // set initial node (first node as clicked)
            this.graphData.nodes[0].clicked = true;
            this.progressSpinnerTracker.next(false);
            this.graphDataTracker.next(res);
            this.highlightPathLinks();
        });
    }

    /**
     * Returns an observable, in which a request is sent to get the count of incoming links of the selected node.
     * param {uri of the selected node} uri
     */
    fetchIncomingLinksCount(uri) {
        return this.store.getIncomingLinksCount(uri, this.dbConfig.dbConfigRequest);
    }

    fetchOutgoingLinksCount(uri) {
        return this.store.getTripleStoreResourceAdditionalCount(uri, this.dbConfig.dbConfigRequest)
    }

    /**
     * 
     * @param nodeUri 
     * @param nodeIndex 
     */
    fetchAdditionalGraphDataLimited(nodeUri: string, nodeIndex: number, node: Node) {
        // before: getTripleStoreResourceAdditionalLimited
        this.store.getTripleStoreResourceAddtional(nodeUri, this.dbConfig.dbConfigRequest).subscribe(res => {
            this.limitedAdditionalDataInflow(nodeUri, res, node)
        });
    }

    /**
     * 
     * @param nodeUri 
     * @param res 
     * @param node 
     */
    private limitedAdditionalDataInflow(nodeUri: string, res, node) {
        const limitDirectShow = appConfig.limit_direct_show
        const limitWarning = appConfig.limit_warning

        let existingChildrenURIs = node.linkList ? node.linkList.map(linkObj => (this.graphData.links[linkObj.linkIndex].target as Node).uri) // .toLowerCase()
            : []
        let newNodes = res.nodes.filter(node => !existingChildrenURIs.find(uri => uri == node.uri) && node.uri != nodeUri)
        // console.log(newNodes)
        if (newNodes.length <= limitDirectShow) {
            this.updateGraphData(res.nodes, res.links, nodeUri);
            this.highlightPathLinks();
        }
    }

    /**
     * Sends a request to get additional incoming graphData, based on the given node.
     * param {uri of the selected node} nodeUri
     * @param nodeUri 
     */
    fetchAdditionalIncomingGraphData(nodeUri) {
        this.store.getTripleStoreResourceIncoming(nodeUri, this.dbConfig.dbConfigRequest).subscribe(res => {
            this.updateGraphDataIncoming(res.nodes, res.links, nodeUri);
            this.highlightPathLinks();
        });
    }

    /**
     * Sends a request to get additional incoming graphData, based on the given node and the entered filtered uri.
     * param {uri of the selected node} nodeUri
     * param {uri that is fetched as an incoming node of the selected node} filteredUri
     * @param nodeUri 
     * @param filteredUri 
     */
    fetchAdditionalIncomingGraphDataWithFilter(nodeUri, filteredUri) {
        this.store.getTripleStoreResourceIncomingWithFilter(nodeUri, filteredUri, this.dbConfig.dbConfigRequest).subscribe(res => {
            this.updateGraphDataIncoming(res.nodes, res.links, nodeUri);
            this.highlightPathLinks();
        });
    }

    /**
     * 
     * @param uuid 
     * @param data 
     * @returns 
     */
    saveGraphData(uuid, data) {
        return this.store.postSavedGraphData(uuid, data);
    }

    /**
     * 
     * @param uuid 
     * @returns 
     */
    getGraphData(uuid) {
        return this.store.getSavedGraphData(uuid);
    }

    /**
     * Sends a request to get the path between to given nodes, that are currently displayed in the graph.
     * It then calls a function to highlight all nodes, based on the response.
     * param {config that is send to determine the path} pathConfig
     * @param pathConfig 
     */
    getPathBetweenNodes(pathConfig: PathConfigData) {
        console.log("getPathBetweenNodes")
        // return this.store.getPathBetweenNodes(fromUri, toUri);
        this.progressSpinnerTracker.next(true);
        this.currentRequest = this.store.getPathBetweenNodes(pathConfig.from, pathConfig.to, pathConfig, this.dbConfig.dbConfigRequest).subscribe(res => {
            const pathLinks = res.results.bindings.filter(l => l.p);
            if (pathLinks.length === 0) {
                alert(`There is no path between ${pathConfig.from} and ${pathConfig.to}`);
            }
            this.setPathLinks(pathLinks);
            this.highlightPathLinks();
            this.progressSpinnerTracker.next(false);
        });
        console.log("getPathBetweenNodes")
    }

    /**
     * Sends a request to get the path between to selected nodes. It then updates the graphData to only include the requested nodes and links
     * param {uri of the node, that is the starting point of the path} fromUri
     * param {uri of the node, that is the ending point of the path} fromUri
     * param {config that is send to determine the path} PathConfigData
     */
    getFullPathBetweenNodes(fromUri: string, toUri: string, pathConfig: PathConfigData) {
        console.log("getFullPathBetweenNodes")
        this.progressSpinnerTracker.next(true);
        this.currentRequest = this.store.getFullPathBetweenNodes(fromUri, toUri, pathConfig, this.dbConfig.dbConfigRequest).subscribe(res => {
            if (res.nodes.length === 0) {
                alert(`There is no path between ${fromUri} and ${toUri}`);
                this.progressSpinnerTracker.next(false);
                return;
            }
            this.graphData = res;
            // sets the count for incoming/outgoing links for every node
            this.initNodeLinkCount();
            // sets an index for every link if there are mutliple that have the same target and source
            this.initDuplicateTargetIndex();
            // set initial node (first node as clicked)
            // this.graphData.nodes[0].clicked = true;
            this.sortLinksByDuplicateTargetIndex(res.links);
            this.progressSpinnerTracker.next(false);
            this.graphDataTracker.next(res);
            this.highlightPathLinks();
        });
    }

    getVirtualGraphs(): Observable<VirtualGraph[]> {
        return this.store.getVirtualGraphs();
    }

    getDBPaths(): Observable<DBPath[]> {
        return this.store.getDBPaths();
    }

    getNamedGraphs(dbitem: DBPath): Observable<string[]> {
        return this.store.getNamedGraphs(dbitem);
    }

    /**
     * 
     * @param pathLinks 
     */
    setPathLinks(pathLinks) {
        this.pathLinks = pathLinks;
        this.graphData.links.forEach((l: Link) => l.highlightPath = false);
    }

    /**
     * Iterates over every link and if its found inside the pathLinks array, the highlightPath property is set to true.
     * Links with this property will be highlighted in the graph.
     */
    highlightPathLinks() {
        this.graphData.links.forEach((l: Link) => {
            this.pathLinks.forEach((selected) => {
                if (selected.p.value === l.label
                    && selected.x.value === ((l.source as Node).uri || l.source)
                    && selected.y.value === ((l.target as Node).uri || l.target)) {
                    l.highlightPath = true;
                }
            });
        });
    }

    /**
     * Sets the x and y properties of every newly added node to the same as the selected node, which was used to fetch new data
     * @param clickedNodeIndex 
     * @param newNodes 
     * @returns {Node[]} newly generated nodes array.
     */
    private setAdditionalNodesPositionBasedOnClickedNode(clickedNodeIndex, newNodes: Node[]): Node[] {
        return newNodes.map(n => ({
            ...n,
            x: this.graphData.nodes[clickedNodeIndex].x,
            y: this.graphData.nodes[clickedNodeIndex].y
        }));
    }

    /**
     * Takes the list of newly fetched nodes, links and the clickedNodeUri and adds the new data to the graphData.
     * @param nodes 
     * @param links 
     * @param clickedNodeUri 
     */
    private updateGraphDataIncoming(nodes: Node[], links: Link[], clickedNodeUri: string) {
        // check if node allready exists, remove it from the array and check if the link allready exists
        const newNodes: Node[] = [];
        const newLinks: Link[] = [];
        nodes.forEach((node: Node) => {
            if (!this.getExistingNode(node)) { newNodes.push(node); }
        });
        const foundNodeIndex = this.getExistingNodeIndexByUri(clickedNodeUri);
        const positionedNodes = this.setAdditionalNodesPositionBasedOnClickedNode(foundNodeIndex, newNodes);
        this.graphData.nodes = this.graphData.nodes.concat(positionedNodes);

        // all links that have the clicked Node as the target
        const targetLinks = this.graphData.links.filter((l: Link) => this.hasTargetThisUri(l, clickedNodeUri));
        links.forEach((l: Link) => {
            const source = this.getExistingNodeByUri(l.source);
            const target = this.getExistingNodeByUri(l.target);
            if (source && target) {
                // check if the same link already exists
                const link = targetLinks.find((targetLink: Link) => {
                    return this.hasSameLabel(l, targetLink) && this.hasSameSource(l, targetLink);
                });
                if (!link) {
                    newLinks.push(l);
                }
            }
        });
        this.graphData.links = this.graphData.links.concat(newLinks);
        this.initNodeLinkCount();
        this.initDuplicateTargetIndex();
        this.sortLinksByDuplicateTargetIndex(this.graphData.links);
        this.graphDataTracker.next(this.graphData);
    }

    /**
     * Takes the list of newly fetched nodes, links and the clickedNodeUri and adds the new data to the graphData.
     * @param nodes 
     * @param links 
     * @param clickedNodeUri 
     */
    private updateGraphData(nodes: Node[], links: Link[], clickedNodeUri: string) {
        const newNodes: Node[] = [];
        const newLinks: Link[] = [];
        nodes.forEach((node: Node) => {
            const foundNode = this.getExistingNode(node);
            if (!foundNode) {
                newNodes.push(node);
            } else {
                // if the node is already inside graphData, add the newly received data
                foundNode.data = {
                    ...foundNode.data,
                    ...node.data
                };
                // Object.keys(node.data).forEach(propertyName => {
                //     if (!foundNode.data[propertyName]){
                //         foundNode.data[propertyName] = node.data[propertyName];
                // }

            }
        });
        const foundNodeIndex = this.getExistingNodeIndexByUri(clickedNodeUri);
        const positionedNodes = this.setAdditionalNodesPositionBasedOnClickedNode(foundNodeIndex, newNodes);
        this.graphData.nodes = this.graphData.nodes.concat(positionedNodes);

        const sourceLinks = this.graphData.links.filter((l: Link) => l.source === clickedNodeUri
            || (l.source as Node).uri === clickedNodeUri);
        links.forEach((l: Link) => {
            const source = this.getExistingNodeByUri(l.source);
            const target = this.getExistingNodeByUri(l.target);
            if (source && target) {
                const link = sourceLinks.find((existingLink: Link) => {
                    return this.hasSameLabel(l, existingLink) && this.hasSameTarget(l, existingLink);
                });
                if (!link) {
                    newLinks.push(l);
                }
            }
        });
        this.graphData.links = this.graphData.links.concat(newLinks);
        this.initNodeLinkCount();
        this.initDuplicateTargetIndex();
        this.sortLinksByDuplicateTargetIndex(this.graphData.links);
        this.graphDataTracker.next(this.graphData);
    }


    /**
     * 
     * @param node 
     */
    deleteNodeInGraph(node: Node) {
        const list = [];
        const listNode = [];
        const setLinks = new Set(this.graphData.links);
        const setNodes = new Set(this.graphData.nodes);
        setLinks.forEach((link) => {
            if (!(link.source === node || link.target === node)) {
                list.push(link);
            }
        });
        setNodes.forEach((node2) => {
            if (!(node2 === node)) {
                listNode.push(node2);
            }
        });
        this.graphData.links = list;
        this.graphData.nodes = listNode;
        this.setGraphDataTracker(this.graphData);
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    checkNodeLinks(node: Node) {
        for (const link of this.graphData.links) {
            if (link.source as Node === node || link.target as Node === node) {
                return true;
            }
        }
        return false;
    }

    /**
     * 
     * @param link 
     */
    deleteLinkInGraph(link: Link) {
        if (this.graphData.links.includes(link)) {
            const index = this.graphData.links.indexOf(link);
            this.graphData.links.splice(index, 1);
            this.setGraphDataTracker(this.graphData);
        }
    }

    /**
     * 
     * @param linkList 
     */
    deleteLinkListInGraph(linkList: Link[]) {
        for (const link of linkList) {
            if (this.graphData.links.includes(link)) {
                const index = this.graphData.links.indexOf(link);
                this.graphData.links.splice(index, 1);
            }
        }
        this.setGraphDataTracker(this.graphData);
    }

    /**
     * 
     * @param uri
     */
    private getExistingNodeIndexByUri(uri: string): number {
        return this.graphData.nodes.findIndex(n => n.uri === uri);
    }

    private getExistingNode(node): Node {
        return this.graphData.nodes.find(n => n.uri === node.uri);
    }

    private getExistingNodeByUri(node: Node | string): Node {
        if (node instanceof Node) {
            return this.graphData.nodes.find(n => n.uri === node.uri);
        } else {
            return this.graphData.nodes.find(n => n.uri === node);
        }
    }

    /**
     * This function sets the duplicateTargetIndex and duplicateTargetCount for every link. They are then used to identify, how many
     * links share the same source and target, to then correctly add a curve and display them in the graph.
     * If there are links, that have other links going in the opposite direction, the direction will be determined by an odd or even index.
     * Example: If there are 3 links with source A and target B, these 3 links will have a duplicateTargetIndex of 0, 1 or 2. If there are
     * 2 links with source A and target B, but also one with source B and target A, the 2 first links will have a duplicateTargetIndex of
     * 0 or 2, while the last one has an index of 1, as it goes in the opposite direction.
     */
    initDuplicateTargetIndex() {
        // this array is filled with LinkData Objects. They have a source, a target and a list of links,
        // that have this same source and target. It is used to group the links, that will be displayed next to each other.
        const foundLinks = [];
        this.graphData.links.forEach((link: Link) => {
            // check if there is already a LinkData object with the source and target of the link object. Sets the opposite direction
            // property if needed.
            const targetNodeIndex = foundLinks.findIndex((data: LinkData) => {
                const source = (link.source as Node).uri || link.source;
                const target = (link.target as Node).uri || link.target;
                const equalSourceTarget = data.source === target && data.target === source;
                link.isOppositeDir = equalSourceTarget;
                return data.source === source && data.target === target || equalSourceTarget;
            });

            if (foundLinks[targetNodeIndex]) {
                foundLinks[targetNodeIndex].links.push(link);
                link.duplicateTargetIndex = foundLinks[targetNodeIndex].links.length - 1;
                if (!foundLinks[targetNodeIndex].hasLinksWithOppositDir) {
                    foundLinks[targetNodeIndex].hasLinksWithOppositDir = link.isOppositeDir;
                }
            } else {
                foundLinks.push({
                    source: (link.source as Node).uri || link.source,
                    target: (link.target as Node).uri || link.target,
                    links: [link],
                    hasLinksWithOppositDir: link.isOppositeDir,
                });
                link.duplicateTargetIndex = 0;
            }
        });
        foundLinks.forEach(foundL => {
            let oddNum = 1;
            let evenNum = 0;
            foundL.links.forEach((l: Link) => {
                // links with an odd/even index are displayed on the left/right side
                // if there are links going in the opposite direction, make sure that
                // all links going in the same direction are either odd or even
                if (foundL.hasLinksWithOppositDir) {
                    l.hasOppositeDirSiblings = true;
                    if (l.isOppositeDir) {
                        l.duplicateTargetIndex = evenNum;
                        evenNum += 2;
                    } else {
                        l.duplicateTargetIndex = oddNum;
                        oddNum += 2;
                    }
                }
                l.evenSiblings = foundL.links.filter(filterL => filterL.isOppositeDir).length;
                l.oddSiblings = foundL.links.filter(filterL => !filterL.isOppositeDir).length;
                l.duplicateTargetCount = foundL.links.length - 1;
            });

        });
    }

    /**
     * Calls a function to set the number of outcoming/incoming links that a node has. It then sets the color and size weight of this node
     * to be the number of outgoing nodes, because in default, the outgoing links will determine the color of the node.
     */
    initNodeLinkCount() {
        this.graphData.nodes.forEach((node) => {
            this.setNodeLinkCount(node, this.graphData.links);
            node.sizeWeight = node.outgoingLinks;
            node.colorWeight = node.outgoingLinks;
        });
    }

    /**
     * Iterates over every link and sets the number of outgoing and incoming links of the given node.
     * param{selected node} node,
     * param{list of available links} links,
     */
    setNodeLinkCount(node: Node, links: Link[]) {
        let numOut = 0;
        let numInc = 0;
        links.forEach(link => {
            const linkSource = link.source as Node;
            if (link.source === node.uri || linkSource.uri === node.uri) {
                numOut++;
            }
            const linkTarget = link.target as Node;
            if (link.target === node.uri || linkTarget.uri === node.uri) {
                numInc++;
            }
        });
        node.outgoingLinks = numOut;
        node.incomingLinks = numInc;
    }

    /**
     * Checks if there are links of type hasPicture. It then removes this link and adds the link object to the node data.
     * @param data 
     */
    setPictureData(data: GraphData) {
        data.links.forEach((link: Link, i) => {
            if (link.label.endsWith("hasPicture")) {
                const node = data.nodes.find((n: Node) => n.uri === ((link.source as Node).uri || link.source))
                    || this.graphData.nodes.find((n: Node) => n.uri === ((link.source as Node).uri || link.source));
                if (node) {
                    node.data.hasPicture = (link.target as Node).uri || link.target as string;
                    data.links = data.links.filter((_, index) => index !== i);

                    // the picture is send as a node, so we delete it
                    const pictureNodeIndex = data.nodes.findIndex((n: Node) => n.uri === ((link.target as Node).uri || link.target));
                    data.nodes = data.nodes.filter((_, index) => index !== pictureNodeIndex);
                }
            }
        });
    }

    /**
     * 
     * @param link 
     * @param uri 
     * @returns 
     */
    hasTargetThisUri(link: Link, uri: string): boolean {
        const targetUri = (link.target as Node).uri || link.target;
        return targetUri === uri;
    }

    /**
     * 
     * @param link 
     * @param uri 
     * @returns 
     */
    hasSourceThisUri(link: Link, uri: string): boolean {
        const sourceUri = (link.source as Node).uri || link.source;
        return sourceUri === uri;
    }

    /**
     * 
     * @param link1 
     * @param link2 
     * @returns 
     */
    hasSameSource(link1: Link, link2: Link) {
        const source1 = (link1.source as Node).uri || link1.source;
        const source2 = (link2.source as Node).uri || link2.source;
        return source1 === source2;
    }

    /**
     * 
     * @param link1 
     * @param link2 
     * @returns 
     */
    hasSameTarget(link1: Link, link2: Link) {
        const target1 = (link1.target as Node).uri || link1.target;
        const target2 = (link2.target as Node).uri || link2.target;
        return target1 === target2;
    }

    /**
     * 
     * @param link1 
     * @param link2 
     * @returns 
     */
    hasSameLabel(link1: Link, link2: Link) {
        return link1.label === link2.label;
    }

    /**
     * 
     * @param links 
     */
    sortLinksByDuplicateTargetIndex(links: Link[]) {
        links.sort((a: Link, b: Link) => a.duplicateTargetIndex > b.duplicateTargetIndex ? -1 : 1);
    }

    /**
     * 
     */
    abortRequest() {
        if (this.currentRequest) { this.currentRequest.unsubscribe(); }
        this.progressSpinnerTracker.next(false);
    }
}
