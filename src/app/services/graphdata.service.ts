import { Injectable } from '@angular/core';
import { NquadsService, Nquad } from './nquads.service';
import { GraphDataNew } from '../models/graphdata/graphdata';
import { Subject } from 'rxjs/internal/Subject';
import { RequestTypeEnum } from './backend.api.service';
import { GraphNode } from '../models/graphdata/graphNode';
import { GraphLink } from '../models/graphdata/graphLink';
import isImageUrl from 'is-image-url';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { PathConfigData } from '../dialogs/pathconfig/pathconfig.dialog';
import { ClassTable, ClassTableData } from './classtable.service';

const RDFS_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
@Injectable({
    providedIn: "root"
})

export class GraphDataService {

    private _graphData: GraphDataNew;
    private _graphData$: Subject<GraphDataNew> = new Subject();
    private _graphDataAdditional$: Subject<GraphDataNew> = new Subject();
    private _graphDataGlobalPath$: Subject<GraphDataNew> = new Subject();
    private _graphRandomNode$: Subject<GraphDataNew> = new Subject();
    private _graphDataGenerateByNquads$: Subject<GraphDataNew> = new Subject();
    private _nodeDictionary: Map<string, GraphNode> = new Map();

    /**
     * 
     * @param nquadsService 
     */
    constructor(private nquadsService: NquadsService) {
        this.nquadsService.nquads$.subscribe(nquads => {
            this._graphData = this.parseToGraphData(nquads);
            this._graphData$.next(this._graphData);
        })

        this.nquadsService.nquadsAdditional$.subscribe(nquads => {
            let newGraphData = this.parseToGraphData(nquads)
            this.mergeGraphData(newGraphData)
            this._graphDataAdditional$.next(newGraphData)
        })

        this.nquadsService.nquadsGlobalPathl$.subscribe(nquads => {
            this._graphData = this.parseToGraphData(nquads);
            this.mergeGraphData(this._graphData)
            this._graphDataGlobalPath$.next(this._graphData);
        })

        this.nquadsService.nquadsRandomNode$.subscribe(nquads => {
            this._graphData = this.parseToGraphData(nquads);
            this._graphRandomNode$.next(this._graphData);
        })

        this.nquadsService.nquadsGenerateGraphByNquads$.subscribe(nquads =>{             
            this._graphData = this.parseToGraphData(nquads);            
            this._graphDataGenerateByNquads$.next(this._graphData);
        })
    }

    get graphData() {
        return this._graphData;
    }

    get graphData$() {
        return this._graphData$.asObservable();
    }

    get graphDataAdditional$() {
        return this._graphDataAdditional$.asObservable();
    }

    get graphDataGlobalPath$() {
        return this._graphDataGlobalPath$.asObservable();
    }

    get graphDataGenerateByNquads$(){
        return this._graphDataGenerateByNquads$.asObservable();
    }

    get graphRandomNode$() {
        return this._graphRandomNode$.asObservable();
    }

    get nodeDictionary() {
        return this._nodeDictionary;
    }

    fetchGenerateGraphByNquads(input: string){
        this.nquadsService.fetchGenerateGraphByNquads(input);
    }

    fetch(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        this.nquadsService.fetchNquads(baseUri, type, isColid);
    }

    /**
     * 
     * @param baseUri 
     * @param type 
     * @param isColid 
     * @returns 
     */
    fetchAdditional(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        this.nquadsService.fetchNquadsAdditional(baseUri, type, isColid)
    }

    /**
     * 
     * @param type 
     * @param noVisualGraph 
     * @returns 
     */
    fetchRandomNode(type: RequestTypeEnum, noVisualGraph: boolean) {
        this.nquadsService.fetchRandom(type, noVisualGraph)
    }

    /**
     * 
     * @param config
     * @param startUri
     * @param endUri
     * @param isColid
     * @returns 
     */
    fetchGlobalPath(config: PathConfigData, startUri: string, endUri: string, isColid: boolean) {
        this.nquadsService.fetchNquadsGlobalPath(config, startUri, endUri, isColid);
    }

    /**
     * 
     * @param baseUri 
     * @param type 
     * @param isColid 
     * @returns 
     */
    fetchAdditionalInstancesForClass$(baseUri: string, type: RequestTypeEnum, isColid: boolean): Observable<GraphNode[]> {
        return this.nquadsService.fetchNquadsAdditional$(baseUri, type, isColid).pipe(
            map((res) => {
                let nodes = this.parseToGraphData(res).nodes;
                return nodes.filter(n => n.outgoingNodes.some(on => on.uri === baseUri && on.predicate === RDFS_TYPE))
            })
        )
    }

    /**
     * 
     * @param baseUri 
     * @param type 
     * @param isColid 
     * @returns 
     */
     fetchInstancesForClassTable$(baseUri: string): Observable<ClassTable> {
         return this.nquadsService.fetchNquadsClassTable$(baseUri).pipe(
             catchError(err => of([])),
             map((res) => {
                 let nodes = this.parseToGraphData(res).nodes;
                 nodes = nodes.filter(n => n.outgoingNodes.some(on => on.uri === baseUri && on.predicate === RDFS_TYPE));
                 let result: ClassTable = {
                     attributes: new Set(),
                     data: []
                 };
                 nodes.forEach(n => {
                     let tableData: ClassTableData = {
                         uri: n.uri
                     };
                     n.data.forEach(d => {
                         result.attributes.add(d.predicate);
                         tableData[d.predicate] = d.value;
                     });
                     n.outgoingNodes.forEach(on => {
                         result.attributes.add(on.predicate);
                         tableData[on.predicate] = on.uri;
                     });
                     result.attributes.add("uri");
                     result.data.push(tableData);
                 });
                 console.log("result from classtable",result);
                 return result;
             }
             )
         );
    }

    /**
     * 
     * @param newGraphData 
     */
    private mergeGraphData(newGraphData: GraphDataNew) {

        newGraphData.nodes.forEach(node => {
            if (!this.nodeDictionary.get(node.uri)) {
                this._graphData.nodes.push(node)
                this._nodeDictionary.set(node.uri, node);
            } else {
                let existingNode: GraphNode = this.nodeDictionary.get(node.uri)
                existingNode.outgoingNodes = this.mergeUnique(existingNode.outgoingNodes, node.outgoingNodes)
                existingNode.incomingNodes = this.mergeUnique(existingNode.incomingNodes, node.incomingNodes)
                existingNode.data = this.mergeUnique(existingNode.data, node.data)
            }
        })
        this.graphData.links.push(...newGraphData.links)
    }

    /**
     * 
     * @param firstList 
     * @param secondList 
     * @returns 
     */
    private mergeUnique(firstList: any[], secondList: any[]): any[] {
        let combined = firstList.concat(...secondList)
        const uniq = new Set(combined.map(e => JSON.stringify(e)));
        return Array.from(uniq).map(e => JSON.parse(e));
    }

    /**
     * side effects: dictionary
     * @param parseToGraphData 
     * @returns 
     */
    private parseToGraphData(input: Nquad[]): GraphDataNew {
        let nodes: GraphNode[] = [];
        let links: GraphLink[] = [];

        input.forEach((triple: Nquad) => {
            if (nodes[triple.subject] == undefined) {
                // subject is a new node
                let node: GraphNode = {
                    uri: triple.subject,
                    outgoingNodes: [],
                    incomingNodes: [],
                    data: []
                };
                nodes[triple.subject] = node;
                this._nodeDictionary.set(node.uri, node);
            }

            if (this.isNodeData(triple.object)) {
                // object is a value for the node
                nodes[triple.subject].data.push({ predicate: triple.predicate, value: triple.object })
            } else {
                // object is a Node
                if (nodes[triple.object] == undefined) {
                    // object is a new Node
                    let node: GraphNode = {
                        uri: triple.object,
                        outgoingNodes: [],
                        incomingNodes: [],
                        data: []
                    };
                    nodes[triple.object] = node;
                    this._nodeDictionary.set(node.uri, node);
                }

                // add incomingNode and outgoingNode Uris
                nodes[triple.object].incomingNodes.push({ predicate: triple.predicate, uri: triple.subject });
                nodes[triple.subject].outgoingNodes.push({ predicate: triple.predicate, uri: triple.object });
                // add a link to the source object
                links.push({
                    predicate: triple.predicate,
                    source: triple.subject,
                    target: triple.object
                })
            }
        })
        // TODO think about it
        return { nodes: this.removeUriFromIndex(nodes), links };
    }

    /**
     * 
     * @param str 
     * @returns 
     */
    isNodeData(str: string): boolean {
        return !/^(http:\/\/|https:\/\/)/.test(str)
            || isImageUrl(str);
    }

    /**
     * 
     * @param input 
     * @returns 
     */
    removeUriFromIndex(input: GraphNode[]): GraphNode[] {
        let result = []
        Object.keys(input).forEach(value => {
            result.push(input[value]);
        })
        return result;
    }
}