import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { DBItem } from "../dialogs/plotconfig/plotconfig.dialog";
import { VirtualGraph } from './dbconfig.service';
export class Autocomplete {
    group: string;
    data: AutocompleteData[];
}
export class AutocompleteData {
    link: string;
    uri: string;
    value: string;
    db?: string;
}
@Injectable({
    providedIn: "root"
})

export class AutocompleteApiService {

    constructor(private httpClient: HttpClient) { }

    /**
     * This function is used to search for inital data to be plotted. It takes a text and returns a list of autocomplete values for it.
     * @param value - the text, that will be used for the autocompletion.
     * @param db - a single dbitem
     * @param vgraphs - a list of virtual graphs
     */
    getAutocompleteValuesAsync(value: string, db: DBItem, vgraphs: VirtualGraph[]): Observable<Autocomplete[]> {
        const request = { dbconfig: this.dbRequestBody([db], [db.virtualGraph]) };
        return this.httpClient.post<Autocomplete[]>
            (`${environment.apis.autocomplete.outgoing}?q=${value}`, request);
    }

    /**
     * This function 
     * @param value 
     * @param db 
     */
    getAutocompleteAdditionalValuesAsync(value: string, baseNodeUri: string, filteredChildURIs: string[], selectedDBs: DBItem[], vgraphs: VirtualGraph[])
        : Observable<AutocompleteData[]> {
        const request = { url: baseNodeUri, filteredChildURIs, dbconfig: this.dbRequestBody(selectedDBs, vgraphs.map(vgraph => vgraph.path)) };
        return this.httpClient.post<AutocompleteData[]>
            (`${environment.apis.autocomplete.outgoingAdditional}?n=${encodeURIComponent(baseNodeUri)}&q=${value}`, request);
    }

    /**
     * This function is used to get autocomplete values for every incoming node of a specific one.
     * @param value  - the text, that will be used for the autocompletion.
     * @param baseNodeUri  - the main node, that has to be the object of every result
     * @param selectedDBs - list of selected dbs, used for the request
     * @param vgraphs  - list of virtual graphs
     */
    getIncomingAutocompleteValuesAsync(value: string, baseNodeUri: string, selectedDBs: DBItem[], vgraphs: VirtualGraph[])
        : Observable<AutocompleteData[]> {
        const request = { dbconfig: this.dbRequestBody(selectedDBs, vgraphs.map(vgraph => vgraph.path)) };
        return this.httpClient.post<AutocompleteData[]>
            (`${environment.apis.autocomplete.incoming}?n=${encodeURIComponent(baseNodeUri)}&q=${value}`, request);
    }

    /**
     * This function is used to get 3 random autocomplete values, that have the selected node as an object
     * @param baseNodeUri - selected nodeT
     * @param selectedDBs  - list of selected dbs, used for the request
     * @param vgraphs - list of virtual graphs
     */
    getIncomingAutocompleteRandomValuesAsync(baseNodeUri: string, selectedDBs: DBItem[], vgraphs: VirtualGraph[])
        : Observable<AutocompleteData[]> {
        const params = `?n=${encodeURIComponent(baseNodeUri)}`;
        const request = { dbconfig: this.dbRequestBody(selectedDBs, vgraphs.map(vgraph => vgraph.path)) };
        return this.httpClient.post<AutocompleteData[]>
            (`${environment.apis.autocomplete.incomingRandom}${params}`, request);
    }

    /**
     * This function constructs the object, that is send as the dbconfig in the requests and specifies, which instances, paths, named graphs and/or
     * virtual graphs will be used.
     * @param selectedDBs - list of selected dbs, used for the request
     * @param virtualGraphs - list of virtual graphs
     */
    private dbRequestBody(selectedDBs: DBItem[], virtualGraphs: string[]) {
        return selectedDBs.map((db: DBItem, i: number) => {
            return {
                dbpath: db.dbpath, selectedNamedGraphs: db.selectedNamedGraphs, instance: db.instance,
                virtualGraphs: i === 0 ? virtualGraphs : undefined
            };
        });
    }

}
