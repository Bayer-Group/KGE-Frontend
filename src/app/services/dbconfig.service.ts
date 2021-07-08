import { Injectable } from '@angular/core';
import { TripleStoreApiService } from './triplestore.api.service';
import { ActivatedRoute } from '@angular/router';
export class DBConfigRequest {
    dbpath: string;
    instance: string;
    searchInDb: boolean;
    selectedNamedGraphs: string[];
    virtualGraphs: string[];
}

export class DBNamedGraphs {
    [key: string]: string[];
}

export class DBPath {
    instance: string;
    dbpath: string;
    name: string;
}

export class VirtualGraph {
    path: string;
    db: string;
}

@Injectable({
    providedIn: "root"
})

export class DBConfigService {

    private _virtualGraphs: VirtualGraph[] = [];
    private _dbPaths: DBPath[] = [];
    private _namedGraphs: Map<DBPath, string[]> = new Map();

    private _selectedDBPaths: DBPath[] = [];
    private _selectedVirtualGraphs: VirtualGraph[] = [];
    private _selectedNamedGraphs: Map<DBPath, string[]> = new Map();
    private _defaultSelectedStore: string;

    constructor(private store: TripleStoreApiService, private activatedRoute: ActivatedRoute) {
        this.store.getDBPaths().subscribe(paths => {
            this._dbPaths = paths;
            // set for each dbPaths the default namedgraph ''
            this._dbPaths.forEach(dbPath => this._selectedNamedGraphs.set(dbPath, ['']));
        });
        this.store.getVirtualGraphs().subscribe(graphs => this._virtualGraphs = graphs);
        this._defaultSelectedStore = this.activatedRoute.snapshot.queryParams["store"];
    }

    get dbPaths() {
        return this._dbPaths;
    }

    get dbConfigRequest(): DBConfigRequest[] {
        let dbConfig: DBConfigRequest[] = this.selectedDBPaths.map(dbpath => {
            return {
                ...dbpath,
                searchInDb: true,
                selectedNamedGraphs: this.selectedNamedGraphs.get(dbpath),
                virtualGraphs: []
            }
        });

        this._selectedVirtualGraphs.forEach(virtualGraph => {
            let selectedDBPathIndex = dbConfig.findIndex(conf => conf.instance === virtualGraph.path);
            if (selectedDBPathIndex != -1) {
                dbConfig[selectedDBPathIndex].virtualGraphs.push(virtualGraph.db);
            } else {
                // no db selected for virutalgraph
                let froundDBPath = this._dbPaths.find(dbpath => dbpath.instance === virtualGraph.path);
                dbConfig.push({
                    ...froundDBPath,
                    searchInDb: false,
                    selectedNamedGraphs: [''],
                    virtualGraphs: [virtualGraph.db]
                })
            }
        })
        return dbConfig;
    }

    get virtualGraphs() {
        return this._virtualGraphs;
    }

    get hasSelectedVirtualGraphs(): boolean {
        return this._selectedVirtualGraphs.length > 0;
    }

    set selectedVirtualGraphs(vGraphs: VirtualGraph[]) {
        this._selectedVirtualGraphs = vGraphs;
    }

    get selectedVirtualGraphs() {
        return this._selectedVirtualGraphs;
    }

    get selectedDBPaths() {
        // if nothing currently selected select the first dbPath as default
        if (this._selectedDBPaths.length === 0) {
            if (this._defaultSelectedStore == "colid") {
                this.selectDBPath(this._dbPaths.find(dbpath => dbpath.name == this._defaultSelectedStore && dbpath.instance == "colidNeptune"));
            } else {
                this.selectDBPath(this._dbPaths[0]);
                this.fetchNamedGraphs(this._dbPaths[0]);
            }
        }
        return this._selectedDBPaths;
    }

    set selectedDBPaths(dbPaths: DBPath[]) {
        this._selectedDBPaths = dbPaths;
    }

    get selectedNamedGraphs() {
        return this._selectedNamedGraphs;
    }

    set selectedNamedGraphs(selection: Map<DBPath, string[]>) {
        this._selectedNamedGraphs = selection;
    }

    /**
     * 
     * @param dbPath 
     */
    fetchNamedGraphs(dbPath: DBPath) {

        this.store.getNamedGraphs(dbPath).subscribe(res => {
            this._namedGraphs.set(dbPath, res);
        });
    }

    /**
     * 
     * @param dbPath 
     */
    selectDBPath(dbPath: DBPath) {
        this._selectedDBPaths.push(dbPath);
        // fetch named graphs for selected graph if not allready done
        if (!this._namedGraphs.has(dbPath)) this.fetchNamedGraphs(dbPath);
    }

    /**
     * 
     * @param dbPath 
     * @returns 
     */
    getNamedGraphs(dbPath: DBPath): string[] {
        return this._namedGraphs.get(dbPath);
    }

}