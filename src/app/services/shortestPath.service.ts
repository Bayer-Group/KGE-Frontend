import { Injectable } from '@angular/core';
import PriorityQueue from "priorityqueue";
import { Subject, Observable } from 'rxjs';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { GraphVisualService } from './graphVisual.service';
export class GraphPathData {
    pathNodes: Array<GraphVisualNode>
    pathLinks: Array<GraphVisualLink>
    constructor(pathNodes, pathLinks) {
        this.pathLinks = pathLinks
        this.pathNodes = pathNodes
    }
}

@Injectable({
    providedIn: "root"
})
export class ShortestPathService {
    private startNode: GraphVisualNode = null;
    private startNodeLabel$: Subject<string> = new Subject<string>();
    private destinationNode: GraphVisualNode = null;
    private graphPathDataSubject: Subject<GraphPathData> = new Subject<GraphPathData>();

    private bidirectional: boolean = false;
    private useHiddenLinks: boolean = false;
    private weightedGraph: boolean = false;

    constructor(private graphVisualService: GraphVisualService) {
    }

    /**
     * 
     * @param value 
     */
    setBidirectional(value: boolean) {
        this.bidirectional = value;
    }

    /**
     * 
     * @param value 
     */
    setWeightedGraph(value: boolean) {
        this.weightedGraph = value;
    }

    /**
     * 
     * @param start 
     * @param state 
     */
    setStartNode(start: GraphVisualNode, state: boolean) {
        if (state) {
            this.startNode = start;
        } else {
            this.startNode = null;
        }
    }

    /**
     * 
     * @param dest 
     * @param state 
     */
    setDestinationNode(dest: GraphVisualNode, state: boolean) {
        if (state) {
            this.destinationNode = dest;
        } else {
            this.destinationNode = null;
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    isStartNode(node: GraphVisualNode): Boolean {
        return node == this.startNode;
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    isDestinationNode(node: GraphVisualNode): Boolean {
        return node == this.destinationNode;
    }

    /**
     * 
     * @returns 
     */
    existsStartNode(): Boolean {
        return this.startNode != null;
    }

    /**
     * 
     * @returns 
     */
    existsDestinationNode(): Boolean {
        return this.destinationNode != null;
    }

    /**
     * 
     * @returns 
     */
    getGraphPathDataSubject() {
        return this.graphPathDataSubject.asObservable();
    }

    /**
     * 
     * @returns 
     */
    isPathActive(): boolean {
        return this.startNode != null && this.destinationNode != null;
    }

    resetPath() {
        this.setStartNode(null, false);
        this.setDestinationNode(null, false);
    }

    getStartNodeLabel$(): Observable<string> {
        return this.startNodeLabel$.asObservable();
    }

    setUseHiddenLinks(value: boolean) {
        this.useHiddenLinks = value
    }

    /**
     * uses dijkstra
     * computes optimal path regarding link priority
     */
    calculatePath() {
        this.graphPathDataSubject.next(null);

        if (this.startNode && this.destinationNode) {

            let nodes = this.graphVisualService.graphVisualData.nodes
            let distances: Map<string, number> = new Map<string, number>();

            // Stores the reference to previous nodes
            let prev: Map<string, { node, link }> = new Map();
            let priorities = new Map<string, number>()

            const comparator = (a, b) => {
                return priorities[a.uri] - priorities[b.uri];
            }

            let prioQueue = new PriorityQueue<GraphVisualNode>({ comparator });

            // Set distances to all nodes to be infinite except startNode
            priorities[this.startNode.uri] = 0;
            prioQueue.enqueue(this.startNode);
            nodes.forEach(node => {
                distances[node.uri] = (node.uri !== this.startNode.uri) ? Infinity : 0;
                prev[node.uri] = null;
            });

            while (!prioQueue.isEmpty()) {
                let minNode = prioQueue.dequeue();
                let currNode = minNode
                currNode.outgoingNodes.concat(this.useHiddenLinks ? currNode.hiddenOutgoingNodes : []).forEach(linkObj => {
                    let link = this.graphVisualService.linkDictionary.get(currNode.uri + linkObj.predicate + linkObj.uri)

                    let weight = this.weightedGraph ? link.rank : 1
                    let alt = distances[currNode.uri] + weight;
                    let linkTarget = linkObj.uri

                    if (alt < distances[linkTarget]) {
                        distances[linkTarget] = alt;
                        prev[linkTarget] = { node: currNode, link: link };
                        priorities[linkTarget] = distances[linkTarget];
                        prioQueue.enqueue(this.graphVisualService.nodeDictionary.get(linkTarget));
                    }

                });

                if (this.bidirectional) {

                    currNode.incomingNodes.concat(this.useHiddenLinks ? currNode.hiddenIncomingNodes : []).forEach(linkObj => {
                        let link = this.graphVisualService.linkDictionary.get(linkObj.uri + linkObj.predicate + currNode.uri)
                        let weight = this.weightedGraph ? link.rank : 1
                        let alt = distances[currNode.uri] + weight;
                        let linkTarget = linkObj.uri
                        console.log(distances[linkTarget])

                        if (alt < distances[linkTarget]) {
                            distances[linkTarget] = alt;
                            prev[linkTarget] = { node: currNode, link: link };
                            priorities[linkTarget] = distances[linkTarget];
                            prioQueue.enqueue(this.graphVisualService.nodeDictionary.get(linkTarget));
                        }

                    });
                }

            }
            // return distances;

            let pathNodes: Array<GraphVisualNode> = []
            let pathLinks: Array<GraphVisualLink> = []
            if (distances[this.destinationNode.uri] != Infinity) {
                this.findPath(pathNodes, pathLinks, prev, this.destinationNode)
            } else {
                if (!this.bidirectional) {
                    alert("No path possible in directed graph")
                } else {
                    alert("No path possible")
                }
            }
            this.graphVisualService.highlightPath(pathNodes, pathLinks)
        }
    }


    /**
     * recursive function, returns the lists of nodes and links from minimal paths
     * @param pathNodes 
     * @param prev 
     * @param index 
     */
    private findPath(pathNodes: Array<GraphVisualNode>, pathLinks: Array<GraphVisualLink>, prev, index: GraphVisualNode) {
        pathNodes.push(index);

        if (prev[index.uri] != null) {
            pathLinks.push(prev[index.uri].link)
            this.findPath(pathNodes, pathLinks, prev, prev[index.uri].node)
        } else {
            pathNodes.reverse();
            pathLinks.reverse();
        }
    }
}