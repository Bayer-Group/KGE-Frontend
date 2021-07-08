import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';


export class FilterBetweenLimitNodeWindowData {
    show: boolean;
    node?: GraphVisualNode;
    uris?: string[];
    nodeDictionary?: Map<string, GraphVisualNode>;
    isOutgoing: boolean;
}

@Injectable({
    providedIn: "root"
})
export class FilterBetweenLimitNodeService {

    private windowData: Subject<FilterBetweenLimitNodeWindowData> = new Subject<FilterBetweenLimitNodeWindowData>();
    private windowDataOut: Subject<FilterBetweenLimitNodeWindowData> = new Subject<FilterBetweenLimitNodeWindowData>();

    /**
     * 
     * @param data 
     */
    setData(data: FilterBetweenLimitNodeWindowData) {
        this.windowData.next(data);
    }

    /**
     * 
     * @returns 
     */
    getDataObservable(): Observable<FilterBetweenLimitNodeWindowData> {
        return this.windowData.asObservable();
    }

    /**
     * 
     * @returns 
     */
    getOutputDataObservable(): Observable<FilterBetweenLimitNodeWindowData> {
        return this.windowDataOut.asObservable();
    }

    /**
     * 
     * @param data 
     */
    hide(data: FilterBetweenLimitNodeWindowData) {
        this.windowData.next(data);
        this.windowDataOut.next(data);
    }



}
