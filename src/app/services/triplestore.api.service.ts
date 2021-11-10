import { environment } from "./../../environments/environment";
import { Link, Node } from "../d3/models";
import { Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DBItem } from "../dialogs/plotconfig/plotconfig.dialog";
import { PathConfigData } from "../dialogs/pathconfig/pathconfig.dialog";
import { DBConfigRequest, VirtualGraph, DBPath } from './dbconfig.service';
import { AuthService } from "../modules/authentication/services/auth.service";

// the following interfaces are used to correctly identify the type of objects that are returned from the api calls
export interface BindingValue {
    p: {
        type: string;
        value: string;
    };
    x: {
        type: string;
        value: string;
    };
    y: {
        type: string;
        value: string;
    };
}

export interface Bindings {
    bindings: [BindingValue];
}

export interface PathResult {
    head: object;
    results: Bindings;
}

export interface TripleStoreApiResult {
    nodes: Node[];
    links: Link[];
}
export interface TripleStoreApiRequest {
    url: string;
    urlAdditional?: string;
}

export interface IncomingApiRequest {
    url: string;
    urlAdditional?: string;
}

export interface IncomingCount {
    count: string;
}

@Injectable({
    providedIn: "root"
})
// tslint:disable:max-line-length
export class TripleStoreApiService {

    public availableDBs = [] as DBItem[];
    public selectedDBs = [] as DBItem[];
    public selectedVirtualGraphs = [] as VirtualGraph[];

    private store: string;
    private userEmail: string;

    constructor(private httpClient: HttpClient, private _authService: AuthService) { }

    /**
     * Returns a http request, in which a selected uri is sent to the /outgoing route. It is used when loading the initial data.
     * param {string} uri - uri of the selected node
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getTripleStoreResource(url: string, dbconfig: DBConfigRequest[]): Observable<TripleStoreApiResult> {
        const request = { url, dbconfig };
        console.log("Outgoing Request:", request)
        return this.httpClient.post<TripleStoreApiResult>
            (`${environment.apis.graphData.outgoing}`, request);
    }

    /**
     * Returns a http request, which returns random graph data and is used for the "i feel lucky" button
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getTripleStoreResourceRandom(dbconfig: DBConfigRequest[]): Observable<TripleStoreApiResult> {
        const request = { dbconfig };
        return this.httpClient.post<TripleStoreApiResult>
            (`${environment.apis.graphData.outgoingRandom}`, request);
    }

    /**
     * Returns a http request, in which a selected uri is sent to the /outgoingAdditional route. 
     * It is used to load additional data when double clicking on a node.
     * param {string} uri - uri of the selected node
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getTripleStoreResourceAddtional(url: string, dbconfig: DBConfigRequest[]): Observable<TripleStoreApiResult> {
        const request = { url, dbconfig };
        return this.httpClient.post<TripleStoreApiResult>
            (`${environment.apis.graphData.outgoingAdditonal}`, request);
    }

    /**
     * It is used to load additional data count when double clicking on a node.
     * @param url 
     */
    getTripleStoreResourceAdditionalCount(url: string, dbconfig: DBConfigRequest[]): Observable<IncomingCount> {
        const request = { url, dbconfig };
        return this.httpClient.post<IncomingCount>
            (`${environment.apis.outgoingAdditonalCount}`, request);
    }

    /**
     * Returns a http request, in which the amount of incoming links of a selected uri is returned.
     * param {string} uri - uri of the selected node
     * return {Observable<IncomingCount>} an observable that you can subscribe to, to receive the answer of the request
     */
    getIncomingLinksCount(url: string, dbconfig: DBConfigRequest[]): Observable<IncomingCount> {
        const request = { url, dbconfig };
        return this.httpClient.post<IncomingCount>(`${environment.apis.count}`, request);
    }

    /**
     * Returns a http request, in which a selected uri is sent to the /incoming route.
     * It is used when you decide to load all incoming links of a specific node.
     * param {string} uri - uri of the selected node
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getTripleStoreResourceIncoming(url: string, dbconfig: DBConfigRequest[]): Observable<TripleStoreApiResult> {
        const request = { url, dbconfig };
        return this.httpClient
            .post<TripleStoreApiResult>(`${environment.apis.graphData.incoming}`, request);
    }

    /**
     * Returns a http request, in which a selected uri and a filtered uri are sent to the /incoming route.
     * It is used when you decide to load a specific node and its incoming links of a node.
     * param {string} uri - uri of the selected node
     * param {string} filteredUri - uri that will be loaded as the incoming one
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getTripleStoreResourceIncomingWithFilter(url: string,
        filteredUri: string,
        dbconfig: DBConfigRequest[]): Observable<TripleStoreApiResult> {
        const request = { url, dbconfig };
        // encode the uri, so that chars like '/' or '#' are not sent as part of the request, as angualar cuts them out of the query
        const requestQuery = `?q=${encodeURIComponent(filteredUri)}`;
        return this.httpClient.post<TripleStoreApiResult>
            (`${environment.apis.graphData.incoming}${requestQuery}`, request);
    }

    /**
     * Returns a http request, in which encoded graph data and its id are sent to save this graph.
     * param {string} id - id of this graph
     * param {string} data - encoded graph data
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    postSavedGraphData(id: string, data: string): Observable<TripleStoreApiResult> {
        const request = { data, id };
        return this.httpClient
            .post<TripleStoreApiResult>(`${environment.apis.graphData.savedGraphData}`, request);
    }

    /**
     * Returns a http request, in which encoded graph data is fetched, based on the given uuid.
     * param {string} uuid - id of a graph
     * return {Observable<TripleStoreApiResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getSavedGraphData(uuid: string): Observable<TripleStoreApiResult> {
        return this.httpClient
            .get<TripleStoreApiResult>(`${environment.apis.graphData.savedGraphData}/${uuid}`);
    }

    /**
     * Returns a http request, in which two node uri's are sent to determine the path from one to another.
     * It is used to highlight the path between the two.
     * param {string} fromUri - uri of the starting node
     * param {string} toUri - uri of the ending node
     * param {PathConfig} pathConfig - config object, that is used to configure the path options (ie. max path length)
     * return {Observable<PathResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getPathBetweenNodes(fromUri: string, toUri: string, pathConfig: PathConfigData, dbconfig: DBConfigRequest[]): Observable<PathResult> {
        const request = {
            ...pathConfig,
            dbconfig: [dbconfig[0]]
        };
        return this.httpClient.post<PathResult>
            (`${environment.apis.paths.links}?from=${fromUri}&to=${toUri}`, request);
    }

    /**
     * Returns a http request, in which two node uri's are sent to determine the path from one to another.
     * It is used to load every received node to display the path between the two given nodes. The difference between this request
     * and the other path request is, that this answer contains properties of every node.
     * param {string} fromUri - uri of the starting node
     * param {string} toUri - uri of the ending node
     * param {PathConfig} pathConfig - config object, that is used to configure the path options (ie. max path length)
     * return {Observable<PathResult>} an observable that you can subscribe to, to receive the answer of the request
     */
    getFullPathBetweenNodes(fromUri: string, toUri: string, pathConfig: PathConfigData, dbconfig: DBConfigRequest[])
        : Observable<TripleStoreApiResult> {
        const request = {
            ...pathConfig,
            dbconfig: [dbconfig[0]]
        };
        console.log("getFullPathBetweenNodes")
        console.log(request)
        return this.httpClient.post<TripleStoreApiResult>
            (`${environment.apis.paths.fullPath}?from=${fromUri}&to=${toUri}`, request);
    }

    /**
     * Returns a http request, in which all available virtual Graphs are fetched.
     * return {Observable<VirtualGraph[]>} an observable that you can subscribe to, to receive the answer of the request
     */
    getVirtualGraphs(): Observable<VirtualGraph[]> {
        return this.httpClient
            .get<VirtualGraph[]>(`${environment.apis.graphData.virtualGraphs}`);
    }

    /**
     * Returns a http request, in which all available named graphs of a selected dbpath are fetched.
     * param {DBItem} dbitem
     * return {Observable<string[]>} an observable that you can subscribe to, to receive the answer of the request
     */
    getNamedGraphs(dbitem: DBPath): Observable<string[]> {
        const request = {
            dbconfig: [{
                dbpath: dbitem.dbpath, instance: dbitem.instance
            }]
        };
        return this.httpClient
            .post<string[]>(`${environment.apis.graphData.namedGraphs}`, request);
    }

    /**
     * Returns a http request, in which all available dbpaths are fetched.
     * return {Observable<DBPath[]>} an observable that you can subscribe to, to receive the answer of the request
     */
    getDBPaths(): Observable<DBPath[]> {
        this._authService.currentEmail$.subscribe(res => {
            this.userEmail = res
            console.log("Current User Email ",this.userEmail)
          });
        let params = new HttpParams().set('user', this.userEmail);
        return this.httpClient.get<DBPath[]>(`${environment.apis.graphData.dbpaths}`, { params: params });
    }

}
