import { GraphVisualNode } from "./graphVisualNode";
import { GraphVisualLink } from "./graphVisualLink"
import { GraphRelatedNode } from '../GraphRelatedNode';



export class GraphVisualData {
    private _nodes: GraphVisualNode[];
    private _hiddenNodes: GraphVisualNode[];
    private _deletedNodes: GraphVisualNode[] = [];
    private _links: GraphVisualLink[];
    private _hiddenLinks: GraphVisualLink[];
    private _deletedLinks: GraphVisualLink[] = [];

    constructor(nodes: GraphVisualNode[], hiddenNodes: GraphVisualNode[], links: GraphVisualLink[], hiddenLinks: GraphVisualLink[]) {
        this._nodes = nodes;
        this._hiddenNodes = hiddenNodes;
        this._links = links;
        this._hiddenLinks = hiddenLinks;
    }

    hideNode(node: GraphVisualNode): void {
        this._nodes = this._nodes.filter(n => n.uri != node.uri)
        this._hiddenNodes.push(node)
    }

    deleteNode(node: GraphVisualNode): void {
        this._nodes = this._nodes.filter(n => n.uri != node.uri)
        this._deletedNodes.push(node)
    }
    showHiddenNode(node: GraphVisualNode): void {
        this._hiddenNodes = this._hiddenNodes.filter(n => n.uri != node.uri)
        this._nodes.push(node)
    }
    showDeletedNode(node: GraphVisualNode): void {

        this._deletedNodes = this._deletedNodes.filter(n => n.uri != node.uri)
        this._nodes.push(node)
    }

    hideDeletedNode(node: GraphVisualNode): void {
        this._deletedNodes = this._deletedNodes.filter(n => n.uri != node.uri)
        this._hiddenNodes.push(node)
    }

    isNode(nodeUri: string): boolean {
        return !!this._nodes.find(n => n.uri === nodeUri)
    }

    isHiddenNode(hiddenNode: string): boolean {
        return !!this._hiddenNodes.find(n => n.uri === hiddenNode)
    }
    isDeletedNode(deletedNode: string): boolean {
        return !!this._deletedNodes.find(n => n.uri === deletedNode)
    }


    cleanUpDeadNode(node: GraphVisualNode): void {
        let deadNode = true;
        node.outgoingNodes.forEach(n => {
            if (this.isLinksBySPO(node.uri, n.predicate, this.uri(n.uri))) {
                deadNode = false
            }
        })

        node.incomingNodes.forEach(n => {
            if (this.isLinksBySPO(this.uri(n.uri), n.predicate, node.uri)) {
                deadNode = false
            }
        })

        if (deadNode) {
            this.hideNode(node)
        }

        // if (node.outgoingNodes.length === 0 && node.incomingNodes.length === 0){
        //     this.hideNode(node)
        // }
    }



    hideLinks(links: GraphVisualLink[], nodeDictionary: Map<string, GraphVisualNode>): void {
        links.forEach(link => {
            this._links = this._links.filter(l => !this.areEqualLinks(l, link))
            this._hiddenLinks = this._hiddenLinks.filter(l => !this.areEqualLinks(l, link))
            this._hiddenLinks.push(link)
            this.moveLinkToHiddenLinkForNode(nodeDictionary.get(this.getSourceUri(link)), link, nodeDictionary.get(this.getTargetUri(link)))
            this.cleanUpDeadNode(nodeDictionary.get(this.getSourceUri(link)))
            this.cleanUpDeadNode(nodeDictionary.get(this.getTargetUri(link)))
        })
    }

    deleteLinks(links: GraphVisualLink[], nodeDictionary: Map<string, GraphVisualNode>): void {
        links.forEach(link => {
            this._links = this._links.filter(l => !this.areEqualLinks(l, link))
            this._deletedLinks = this._deletedLinks.filter(l => !this.areEqualLinks(l, link))
            this._deletedLinks.push(link)
            this.moveLinkToDeletedLinkForNode(nodeDictionary.get(this.getSourceUri(link)), link, nodeDictionary.get(this.getTargetUri(link)))

            this.cleanUpDeadNode(nodeDictionary.get(this.getSourceUri(link)))
            this.cleanUpDeadNode(nodeDictionary.get(this.getTargetUri(link)))
        })

    }

    hideDeletedLinks(links: GraphVisualLink[], nodeDictionary: Map<string, GraphVisualNode>): void {
        links.forEach(link => {
            this._deletedLinks = this._deletedLinks.filter(l => !this.areEqualLinks(l, link))
            this._hiddenLinks = this._hiddenLinks.filter(l => !this.areEqualLinks(l, link))
            this._hiddenLinks.push(link)
            this.moveDeletedLinkToHiddenLinkForNode(nodeDictionary.get(this.getSourceUri(link)), link, nodeDictionary.get(this.getTargetUri(link)))
            this.cleanUpDeadNode(nodeDictionary.get(this.getSourceUri(link)))
            this.cleanUpDeadNode(nodeDictionary.get(this.getTargetUri(link)))
        })
    }

    /**
     * 
     * @param hiddenLinks 
     * @param nodeDictionary 
     */
    showLinks(hiddenLinks: GraphVisualLink[], nodeDictionary: Map<string, GraphVisualNode>): void {
        hiddenLinks.forEach(hiddenLink => {
            if (this.isNode(this.getSourceUri(hiddenLink)) && this.isNode(this.getTargetUri(hiddenLink))) {
                this._hiddenLinks = this._hiddenLinks.filter(l => !this.areEqualLinks(l, hiddenLink))
                // this._links=this._links.filter(l => !this.areEqualLinks(l, hiddenLink))
                this._links.push(hiddenLink)
                this.moveHiddenLinkToLinkForNode(nodeDictionary.get(this.getSourceUri(hiddenLink)), hiddenLink, nodeDictionary.get(this.getTargetUri(hiddenLink)))
            } else {

            }

        })
    }

    isLink(link: GraphVisualLink): boolean {
        return !!this._links.find(l => l === link)
    }

    isLinksBySPO(s: string, p: string, o: string) {
        return !!this._links.find(l => this.getSourceUri(l) === s && l.predicate === p && this.getTargetUri(l) === o)
    }


    isHiddenLink(hiddenLink: GraphVisualLink): boolean {
        return !!this._hiddenLinks.find(l => l === hiddenLink)
    }



    moveLinkToHiddenLinkForNode(source: GraphVisualNode, link: GraphVisualLink, target: GraphVisualNode) {
        source.outgoingNodes = source.outgoingNodes.filter(l => link.predicate != l.predicate || this.uri(target.uri) != this.uri(l.uri))
        if (!source.hiddenOutgoingNodes.find(l => l.predicate == link.predicate && l.uri == target.uri)) {
            source.hiddenOutgoingNodes.push(new GraphRelatedNode(link.predicate, target.uri))
        }
        target.incomingNodes = target.incomingNodes.filter(l => link.predicate != l.predicate || source.uri != l.uri)
        if (!target.hiddenIncomingNodes.find(l => l.predicate == link.predicate && l.uri == source.uri)) {
            target.hiddenIncomingNodes.push(new GraphRelatedNode(link.predicate, source.uri))
        }
    }

    moveHiddenLinkToLinkForNode(source: GraphVisualNode, link: GraphVisualLink, target: GraphVisualNode) {

        source.hiddenOutgoingNodes = source.hiddenOutgoingNodes.filter(l => link.predicate != l.predicate || target.uri != l.uri)
        if (!source.outgoingNodes.find(l => l.predicate == link.predicate && l.uri == target.uri)) {
            source.outgoingNodes.push(new GraphRelatedNode(link.predicate, target.uri))
        }
        target.hiddenIncomingNodes = target.hiddenIncomingNodes.filter(l => link.predicate != l.predicate || source.uri != l.uri)
        if (!target.incomingNodes.find(l => l.predicate == link.predicate && l.uri == source.uri)) {
            target.incomingNodes.push(new GraphRelatedNode(link.predicate, source.uri))
        }
    }

    moveLinkToDeletedLinkForNode(source: GraphVisualNode, link: GraphVisualLink, target: GraphVisualNode) {
        source.outgoingNodes = source.outgoingNodes.filter(l => link.predicate != l.predicate || this.uri(target.uri) != this.uri(l.uri))
        if (!source.deletedOutgoingNodes.find(l => l.predicate == link.predicate && l.uri == target.uri)) {
            source.deletedOutgoingNodes.push(new GraphRelatedNode(link.predicate, target.uri))
        }

        target.incomingNodes = target.incomingNodes.filter(l => link.predicate != l.predicate || this.uri(source.uri) != this.uri(l.uri))
        if (!target.deletedIncomingNodes.find(l => l.predicate == link.predicate && l.uri == source.uri)) {
            target.deletedIncomingNodes.push(new GraphRelatedNode(link.predicate, source.uri))
        }
    }

    moveDeletedLinkToLinkForNode(source: GraphVisualNode, link: GraphVisualLink, target: GraphVisualNode) {

        source.deletedOutgoingNodes = source.deletedOutgoingNodes.filter(l => link.predicate != l.predicate || target.uri != l.uri)
        if (!source.outgoingNodes.find(l => l.predicate == link.predicate && l.uri == target.uri)) {
            source.outgoingNodes.push(new GraphRelatedNode(link.predicate, target.uri))
        }

        target.deletedIncomingNodes = target.deletedIncomingNodes.filter(l => link.predicate != l.predicate || source.uri != l.uri)
        if (!target.incomingNodes.find(l => l.predicate == link.predicate && l.uri == source.uri)) {
            target.incomingNodes.push(new GraphRelatedNode(link.predicate, source.uri))
        }
    }
    moveDeletedLinkToHiddenLinkForNode(source: GraphVisualNode, link: GraphVisualLink, target: GraphVisualNode) {

        source.deletedOutgoingNodes = source.deletedOutgoingNodes.filter(l => link.predicate != l.predicate || target.uri != l.uri)
        if (!source.hiddenOutgoingNodes.find(l => l.predicate == link.predicate && l.uri == target.uri)) {
            source.hiddenOutgoingNodes.push(new GraphRelatedNode(link.predicate, target.uri))
        }

        target.deletedIncomingNodes = target.deletedIncomingNodes.filter(l => link.predicate != l.predicate || source.uri != l.uri)
        if (!target.hiddenIncomingNodes.find(l => l.predicate == link.predicate && l.uri == source.uri)) {
            target.hiddenIncomingNodes.push(new GraphRelatedNode(link.predicate, source.uri))
        }
    }

    get nodes(): GraphVisualNode[] {
        return this._nodes
    }

    get hiddenNodes(): GraphVisualNode[] {
        return this._hiddenNodes
    }

    get deletedNodes(): GraphVisualNode[] {
        return this._deletedNodes
    }

    get links(): GraphVisualLink[] {
        return this._links
    }
    get hiddenLinks(): GraphVisualLink[] {
        return this._hiddenLinks
    }
    get deletedLinks(): GraphVisualLink[] {
        return this._deletedLinks
    }
    set nodes(nodes: GraphVisualNode[]) {
        this._nodes = nodes
    }
    set hiddenNodes(hiddenNodes: GraphVisualNode[]) {
        this._hiddenNodes = hiddenNodes
    }
    set deletedNodes(deletedNodes: GraphVisualNode[]) {
        this._deletedNodes = deletedNodes
    }
    set links(links: GraphVisualLink[]) {
        this._links = links
    }
    set hiddenLinks(hiddenLinks: GraphVisualLink[]) {
        this._hiddenLinks = hiddenLinks
    }
    set deletedLinks(deletedLinks: GraphVisualLink[]) {
        this._deletedLinks = deletedLinks
    }

    getSourceUri(link: GraphVisualLink) {
        let uri = link.source
        if (typeof uri != "string") {
            uri = uri.uri
        }
        return uri

    }
    // getSourceNodeFromLink(link: GraphVisualLinkNew){
    //     return link.source as unknown as GraphVisualNode
    // }
    getTargetUri(link: GraphVisualLink) {
        let uri = link.target
        if (typeof uri != "string") {
            uri = uri.uri
        }
        return uri
    }

    areEqualLinks(link1: GraphVisualLink, link2: GraphVisualLink): boolean {
        return this.getSourceUri(link1) === this.getSourceUri(link2)
            && link1.predicate === link2.predicate
            && this.getTargetUri(link1) === this.getTargetUri(link2)
    }

    uri(u: string) {
        let uri = u
        if (typeof uri != "string") {
            uri = (uri as unknown as GraphRelatedNode).uri
        }
        return uri
    }

}