import { Injectable } from '@angular/core';
import { GraphVisualService } from "./graphVisual.service"
import { RequestTypeEnum } from './backend.api.service'
import { Subject } from 'rxjs';
import { GraphVisualData } from '../models/graphvisual/graphVisualData';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import appConfig from "src/app/config_default.json";
import { PathConfigData } from '../dialogs/pathconfig/pathconfig.dialog';


@Injectable({
    providedIn: "root"
})
export class FacadeService {
    private _graphVisualData: GraphVisualData = new GraphVisualData([], [], [], []);
    private _graphVisualData$: Subject<GraphVisualData> = new Subject();
    private _graphVisualAdditionalNew$: Subject<GraphVisualData> = new Subject();
    // can be problematic
    private baseUri;

    constructor(private graphVisualService: GraphVisualService) {
        this.graphVisualService.graphVisualData$.subscribe(data => {
            this._graphVisualData$.next(this._graphVisualData)
        })
        this.graphVisualService.graphVisualAdditionalNew$.subscribe(data => {
            this._graphVisualData = data;
            this._graphVisualData$.next(this._graphVisualData);
        })
        this.graphVisualService.graphVisualRandomData$.subscribe(data => {
            this._graphVisualData = data;
            this._graphVisualData$.next(this._graphVisualData);
        })
    }

    /**
     * 
     * @param nodeUri 
     * @returns 
     */
    getVisualNode(nodeUri: string): GraphVisualNode {
        return this._graphVisualData.nodes.find(node => node.uri === nodeUri)
    }

    /**
     * 
     * @param baseUri 
     */
    fetchInitial(baseUri: string) {
        if (baseUri == appConfig.character_to_plot_all) {

            this.graphVisualService.fetch(baseUri, RequestTypeEnum.ALL, false)
        } else {
            this.baseUri = baseUri
            this.graphVisualService.fetch(baseUri, RequestTypeEnum.OUTGOING, false)
        }

    }

    fetchGenerateGraphByNquads(input: string){
        this.graphVisualService.fetchGenerateGraphByNquads(input)
    }

    fetchRandom(noVisualGraph: boolean) {
        this.graphVisualService.fetchRandom(noVisualGraph)
    }

    /**
     * 
     * @param config 
     * @param startUri 
     * @param endUri 
     */
    fetchGlobalPath(config: PathConfigData, startUri: string, endUri: string) {
        this.graphVisualService.fetchGlobalPathGV(config, startUri, endUri)
    }

    /**
     * 
     * @param baseUri 
     * @param type 
     * @param isColid 
     */
    fetchAdditional(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        this.baseUri = baseUri
        this.graphVisualService.fetchAdditional(baseUri, type, isColid)
    }

    get graphVisualData() {
        return this._graphVisualData;
    }

    set graphVisualData(graphVisualData: GraphVisualData) {
        this._graphVisualData = graphVisualData;
        this._graphVisualData$.next(graphVisualData)
    }

    get graphVisualData$() {
        return this._graphVisualData$.asObservable();
    }

    get graphVisualAdditionalNew$() {
        return this._graphVisualAdditionalNew$.asObservable();
    }
}

