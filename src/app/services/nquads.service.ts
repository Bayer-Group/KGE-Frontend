import { Injectable } from '@angular/core';
import { BackendAPIService, RequestTypeEnum } from './backend.api.service';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PathConfigData } from '../dialogs/pathconfig/pathconfig.dialog';

export class Nquad {
    subject: string;
    predicate: string;
    object: string;
}

@Injectable({
    providedIn: "root"
})

export class NquadsService {

    private _nquads: Nquad[];
    private _nquadsTracker: Subject<Nquad[]> = new Subject<Nquad[]>();
    private _nquadsAdditionalTracker: Subject<Nquad[]> = new Subject<Nquad[]>();
    private _nquadsGlobalPathTracker: Subject<Nquad[]> = new Subject<Nquad[]>();
    private _nquadsNquadsRandomNodePathTracker: Subject<Nquad[]> = new Subject<Nquad[]>();
    private _nquadsGenerateByNQuadsTracker: Subject<Nquad[]> = new Subject<Nquad[]>();

    /**
     * 
     * @param backendApi 
     */
    constructor(private backendApi: BackendAPIService) {

    }

    /** TODO noVisualGraphs align IsColid Var value please CHECK THIS!!! */
    fetchNquadsAdditional$(baseUri: string, type: RequestTypeEnum, noVisualGraphs: boolean): Observable<Nquad[]>{
        return this.backendApi.fetchGraphData$(baseUri, type, false, noVisualGraphs).pipe(
            map(raw => this.parseNquads(raw))
        )
    }

    fetchNquadsClassTable$(baseUri: string): Observable<Nquad[]>{
        return this.backendApi.fetchClassTableIncoming$(baseUri).pipe(
            map(raw => this.parseNquads(raw))
        )
    }
    
    fetchRandom(type: RequestTypeEnum, noVisualGraphs: boolean){
        this.backendApi.fetchRandomNode$(type ,noVisualGraphs).subscribe(raw => {          
            this.nquads = this.parseNquads(raw); 
            this._nquadsNquadsRandomNodePathTracker.next(this.nquads)
        })        
    }

    fetchGenerateGraphByNquads(input: string){
        let value =this.parseNquads(input);
        if(value != null){
            this._nquadsGenerateByNQuadsTracker.next(value)
        }
    }

    fetchNquads(baseUri: string, type: RequestTypeEnum, isColid: boolean) {
        this.backendApi.fetchGraphData$(baseUri, type, isColid).subscribe(raw => {          
            this.nquads = this.parseNquads(raw);
        })        
    }
    
    fetchNquadsGlobalPath(config: PathConfigData, startUri: string, endUri: string, isColid: boolean){
        this.backendApi.fetchRouteData$(config, startUri, endUri, isColid).subscribe(raw => {          
            let newNquads = this.parseNquads(raw);           
            this.mergeNquads(newNquads)
            this._nquadsGlobalPathTracker.next(newNquads)
        })
    }

    fetchNquadsAdditional(baseUri: string, type: RequestTypeEnum, isColid: boolean){        
        this.backendApi.fetchGraphData$(baseUri, type, isColid).subscribe(raw => {          
            let newNquads = this.parseNquads(raw);           
            this.mergeNquads(newNquads)
            this._nquadsAdditionalTracker.next(newNquads)
        })
    }

    get nquads(): Nquad[] {
        return this._nquads;
    }

    set nquads(n: Nquad[]) {
        this._nquads = this.getUniqueElements(n);
        this._nquadsTracker.next(this.nquads);
    }

    get nquads$(): Observable<Nquad[]> {
        return this._nquadsTracker.asObservable();
    }

    get nquadsRandomNode$(): Observable<Nquad[]> {
        return this._nquadsNquadsRandomNodePathTracker.asObservable();
    }    
    
    get nquadsGenerateGraphByNquads$(): Observable<Nquad[]> {
        return this._nquadsGenerateByNQuadsTracker.asObservable();
    }    

    get nquadsGlobalPathl$(): Observable<Nquad[]> {
        return this._nquadsGlobalPathTracker.asObservable();
    }

    get nquadsAdditional$(): Observable<Nquad[]> {
        return this._nquadsAdditionalTracker.asObservable();
    }
    

    private parseNquads(rawNquads: string): Nquad[] {        
        let triples: Nquad[] = [];
        const lines = rawNquads.split(/\.\r?\n/).filter(x => Boolean(x.trim())); 
        // split the lines with .\n, keep only the non-empty lines
        // .filter(Boolean) does not remove lines with a single space
        lines.forEach(line => {
            const attributes = line.split(/\" |> /);

            triples.push({
                subject: this.prettyString(attributes[0]),
                predicate: this.prettyString(attributes[1]),
                object: this.prettyString(attributes[2])
            })
        });
        return triples;
    }

    /**
     * 
     * @param arr 
     * @returns 
     */
    private getUniqueElements(arr: any[]) {
        const uniq = new Set(arr.map(e => JSON.stringify(e)));
        return Array.from(uniq).map(e => JSON.parse(e));
    }

    /**
     * 
     * @param nquads 
     */
    private mergeNquads(nquads: Nquad[]) {
        if (this._nquads) {
            this._nquads.push(...nquads);
        } else {
            this._nquads = nquads;
        }

        this._nquads = this.getUniqueElements(nquads)
    }

    /**
     * 
     * @param str 
     * @returns 
     */
    private prettyString(str: string): string {
        let s = ""
        if (str) {

            s = str.replace(/\"|<|>/g, "");
        }

        return this.convertUmlaute(s).trim(); // use the trim here
    }

    /**
     * 
     * @param str 
     * @returns 
     */
    private convertToUnicode(str: string): string {
        return String.fromCharCode(parseInt("0x" + str.substring(2, str.length))); // parseInt("0x"+ can be removed
    }

    /**
     * 
     * @param str 
     * @returns 
     */
    private convertUmlaute(str: string) {
        return str.replace(/\\u\w\w\w\w/g, this.convertToUnicode);
    }
}