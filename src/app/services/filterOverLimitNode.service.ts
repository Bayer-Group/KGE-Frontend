import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';

export class FilterOverLimitNodeWindowData {
    show: boolean;
    node?: GraphVisualNode;
    uris?: string[];
    nodeDictionary?: Map<string, GraphVisualNode>;
    linkDictionary?: Map<string, GraphVisualLink>;
    isOutgoing: boolean
}

@Injectable({
    providedIn: "root"
})
export class FilterOverLimitNodeService {

    private searchbarData: Subject<FilterOverLimitNodeWindowData> = new Subject<FilterOverLimitNodeWindowData>();
    private windowDataOut: Subject<FilterOverLimitNodeWindowData> = new Subject<FilterOverLimitNodeWindowData>();

    /**
     * 
     * @param data 
     */
    setData(data: FilterOverLimitNodeWindowData) {
        this.searchbarData.next(data);
    }

    /**
     * 
     * @returns 
     */
    getDataObservable(): Observable<FilterOverLimitNodeWindowData> {
        return this.searchbarData.asObservable();
    }

    /**
     * 
     * @returns 
     */
    getOutputDataObservable(): Observable<FilterOverLimitNodeWindowData> {
        return this.windowDataOut.asObservable();
    }

    /**
     * 
     * @param data 
     */
    hide(data: FilterOverLimitNodeWindowData) {
        this.searchbarData.next(data);
        this.windowDataOut.next(data);
    }

}
