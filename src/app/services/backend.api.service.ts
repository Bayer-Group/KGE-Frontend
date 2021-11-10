import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';;
import { Observable } from 'rxjs';
import { DBConfigService } from './dbconfig.service';
import { environment } from "./../../environments/environment";
import { ClassTableApiRes, ClassTableRequest, ClassTableLabelRequest, ClassTableLabelResponse } from './classtable.service';
import { ProfileService } from './profile.service';
import { PathConfigData } from '../dialogs/pathconfig/pathconfig.dialog';

export enum RequestTypeEnum {
    OUTGOING = "outgoing",
    INCOMING = "incoming",
    ALL = "all",
    GLOBALPATH = "globalpath",
    RANDOMNODE = "randomnode",
}

@Injectable({
    providedIn: "root"
})
export class BackendAPIService {

    constructor(private httpClient: HttpClient, private dbConfig: DBConfigService, private _profile: ProfileService) {
    }

    /**
     * 
     * @param type 
     * @param noVisualGraphs 
     * @returns 
     */
    fetchRandomNode$(type: RequestTypeEnum, noVisualGraphs?: boolean): Observable<string> {
        let dbconfig = this.dbConfig.dbConfigRequest;
        if (noVisualGraphs) {
            dbconfig.forEach((db, index) => {
                if (db.virtualGraphs.length > 0) dbconfig[index].virtualGraphs = [];
            })
        }

        let request = {
            url: "randomNode",
            dbconfig,
        };
        return this.httpClient.post(`${environment.apis.graphData.new}?type=${type}`, request, { responseType: 'text' })
    }

    /**
     * 
     * @param config 
     * @param startUri 
     * @param endUri 
     * @param isColid 
     * @param noVisualGraphs 
     * @returns 
     */
    fetchRouteData$(config: PathConfigData, startUri: string, endUri: string, isColid: boolean, noVisualGraphs?: boolean): Observable<string> {
        let request = {};
        if (this._profile.profileName == "colid" || isColid) {
            request = {
                startUri: startUri,
                endUri: endUri,
                dbconfig: [
                    {
                        instance: "colidNeptune",
                        dbpath: "/sparql",
                        name: "colid",
                        searchInDb: true,
                        selectedNamedGraphs: [""],
                        virtualGraphs: []
                    }
                ],
                pathConfig: config
            }
            return this.httpClient.post(`${environment.apis.graphData.new}?type=globalpath`, request, { responseType: 'text' })
        }
        else {
            let dbconfig = this.dbConfig.dbConfigRequest;
            if (noVisualGraphs) {
                dbconfig.forEach((db, index) => {
                    if (db.virtualGraphs.length > 0) dbconfig[index].virtualGraphs = [];
                })
            }

            request = {
                startUri: startUri,
                endUri: endUri,
                dbconfig,
                pathConfig: config
            };
        }
        return this.httpClient.post(`${environment.apis.graphData.new}?type=globalpath`, request, { responseType: 'text' })
    }

    /**
     * 
     * @param baseUri 
     * @param type 
     * @param isColid 
     * @param noVisualGraphs 
     * @returns 
     */
    fetchGraphData$(baseUri: string, type: RequestTypeEnum, isColid: boolean, noVisualGraphs?: boolean): Observable<string> {
        let request = {};
        if (this._profile.profileName == "colid" || isColid) {
            request = {
                url: baseUri,
                dbconfig: [
                    {
                        instance: "colidNeptune",
                        dbpath: "/sparql",
                        name: "colid",
                        searchInDb: true,
                        selectedNamedGraphs: [""],
                        virtualGraphs: []
                    }
                ]
            }
            if (type == RequestTypeEnum.ALL) {
                return this.httpClient.post(`${environment.apis.graphData.new}?type=colid`, request, { responseType: 'text' })
            }
            return this.httpClient.post(`${environment.apis.graphData.new}?type=${type}`, request, { responseType: 'text' })
        }
        else {
            let dbconfig = this.dbConfig.dbConfigRequest;
            if (noVisualGraphs) {
                dbconfig.forEach((db, index) => {
                    if (db.virtualGraphs.length > 0) dbconfig[index].virtualGraphs = [];
                })
            }


            request = {
                url: baseUri,
                dbconfig,
            };
        }

        return this.httpClient.post(`${environment.apis.graphData.new}?type=${type}`, request, { responseType: 'text' })
    }

    /**
     * 
     * @param request 
     * @returns 
     */
    saveClassTableData$(request: ClassTableRequest): Observable<ClassTableApiRes> {
        return this.httpClient.post<ClassTableApiRes>(`${environment.apis.graphData.classtable}`, request);
    }

    /**
     * 
     * @param request 
     * @returns 
     */
    fetchLabels$(request: ClassTableLabelRequest): Observable<ClassTableLabelResponse> {
        return this.httpClient.post<ClassTableLabelResponse>(`${environment.apis.graphData.classtableLabels}`, request);
    }

    /**
     * 
     * @param classUri 
     * @returns 
     */
    fetchVitualGraphsAttributes$(classUri: string): Observable<string[]> {
        return this.httpClient.post<string[]>(`${environment.apis.graphData.classTableVirtualGraphs}`, { uri: classUri, dbconfig: this.dbConfig.dbConfigRequest });
    }
    fetchClassTableIncoming$(baseUri: string): Observable<string> {

        let dbconfig = this.dbConfig.dbConfigRequest;
                dbconfig.forEach((db, index) => {
                    if (db.virtualGraphs.length > 0) dbconfig[index].virtualGraphs = [];
                })
            
            let request = {
                url: baseUri,
                dbconfig,
            };
        return this.httpClient.post(`${environment.apis.graphData.classTableIncoming}`, request, { responseType: 'text' })

    }
}