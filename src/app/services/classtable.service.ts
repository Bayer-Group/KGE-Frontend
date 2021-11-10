import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BackendAPIService, RequestTypeEnum } from './backend.api.service';
import { GraphDataService } from './graphdata.service';
import { ProfileService } from './profile.service';
import { DBConfigRequest, DBConfigService } from './dbconfig.service';
import { AuthService } from '../modules/authentication/services/auth.service';

export class ClassTable {
    attributes: Set<string>;
    data: ClassTableData[];
}

export class ClassTableData {
    [key: string]: string;
}

export class ClassTableRequest {
    classUri: string;
    attributes: ClassTableAttributes[];
    dbConfig: DBConfigRequest[];
    user: string;
}

export class ClassTableLabelRequest {
    attributes: string[];
    labels: string[];
    dbConfig: DBConfigRequest[];
}

export class ClassTableLabelResponse {
    [key: string]: string[];
}

export class ClassTableAttributes {
    uri: string;
    display: string;
}

export class ClassTableApiRes {
    endpoint: string;
}

@Injectable({
    providedIn: "root"
})

export class ClassTableService {

    constructor(private _graphData: GraphDataService,
        private _api: BackendAPIService,
        private _profile: ProfileService,
        private _dbConfig: DBConfigService,
        private _authService: AuthService) { }
    private userEmail: string;

    /**
     * 
     * @param uri 
     * @returns 
     */
    fetchInstanceDataFromTripleStores$(uri: string): Observable<ClassTable> {
        return this._graphData.fetchAdditionalInstancesForClass$(uri, RequestTypeEnum.INCOMING, this._profile.profileName == "colid").pipe(
            catchError(err => of([])),
            map(res => {
                console.log(res);
                let result: ClassTable = {
                    attributes: new Set(),
                    data: []
                }
                res.forEach(n => {
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
                    })
                    result.attributes.add("uri");
                    result.data.push(tableData);
                })
                console.log(result);
                return result;
            })
        )
    }
    /**
     * 
     * @param classUri 
     * @returns 
     */
    fetchVirtualGraphsAttributes$(classUri: string): Observable<string[]> {
        return this._api.fetchVitualGraphsAttributes$(classUri);
    }

    /**
     * 
     * @param uri 
     * @returns 
     */
    fetchClassTableDataWithVirtualGraph$(uri: string): Observable<ClassTable> {
        return forkJoin(
            this.fetchInstanceDataFromTripleStores$(uri),
            this.fetchVirtualGraphsAttributes$(uri)
        ).pipe(
            map(res => {
                let merged = res[0];
                res[1].forEach(attr => merged.attributes.add(attr))
                console.log(res, merged);
                return merged;
            })
        );
    }

    /**
     * 
     * @param uri 
     * @returns 
     */
    fetchClassTableData$(uri: string): Observable<ClassTable> {
        return this._graphData.fetchInstancesForClassTable$(uri);
    }

    /**
     * 
     * @param classUri 
     * @param selectedAttributes 
     * @param attributeDisplay 
     * @returns 
     */
    save$(classUri: string, selectedAttributes: string[], attributeDisplay: { [key: string]: string }): Observable<ClassTableApiRes> {
        this._authService.currentEmail$.subscribe(res => {
            this.userEmail = res
            console.log("Current User Email for ClassTable",this.userEmail)
          });
        let request: ClassTableRequest = {
            classUri,
            attributes: [],
            dbConfig: this._dbConfig.dbConfigRequest,
            user: this.userEmail,
        }

        selectedAttributes.forEach(attr => {
            request.attributes.push({ uri: attr, display: attributeDisplay[attr].replace(/\s/g, "_").replace("@en", "").replace("@de", "") });
        })
        return this._api.saveClassTableData$(request);

    }

    /**
     * 
     * @param attributes 
     * @returns 
     */
    fetchLables$(attributes: string[]): Observable<ClassTableLabelResponse> {
        let request: ClassTableLabelRequest = {
            attributes,
            labels: this._profile.profileData.graph.node.data.showLabel,
            dbConfig: this._dbConfig.dbConfigRequest
        }

        return this._api.fetchLabels$(request);
    }


}