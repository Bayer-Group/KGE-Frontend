import { ConfigurationService, ConfigData } from "../services/configuration.service";
import { ForceDirectedGraph } from "./../d3/models/force-directed-graph";
import { TripleStoreService } from "./triplestore.service";
import { Node, DataObject } from "../d3/models/node";
import { Injectable } from "@angular/core";
import { Link } from "../d3/models";
import { SidebarService, SidebarDataNew } from "./sidebar.service";
import { v4 as uuidv4 } from "uuid";
import { Observable, BehaviorSubject, Subject } from "rxjs";

export class SaveData {
    graphData: GraphStorageData;
    configData: ConfigData;
    sidebarData?: SidebarDataNew;
}

export class GraphStorageData {
    nodes: Node[];
    links: Link[];
}

@Injectable({
    providedIn: "root"
})

export class SaveService {
    private pathTracker: BehaviorSubject<string> = new BehaviorSubject<string>("");
    public savestateconfig: Subject<boolean> = new Subject<boolean>();
    
    /**
     * 
     * @param store 
     * @param config 
     * @param sidebar 
     */
    constructor(private store: TripleStoreService, private config: ConfigurationService, private sidebar: SidebarService) { }

    /**
     * 
     * @returns 
     */
    getPathTracker(): Observable<string> {
        return this.pathTracker.asObservable();
    }

    /**
     * 
     * @param path 
     */
    setPath(path) {
        const params = new URLSearchParams(window.location.search);
        if (path === "") {
            window.history.pushState("", "DataVisual", "/?" + params);
        } else {
            window.history.pushState("", "DataVisual", `${path}?${params}`);
        }
        this.pathTracker.next(path);
    }

    /**
     * 
     * @param graph 
     * @returns 
     */
    saveCurrentState(graph: ForceDirectedGraph): string {
        const indexedLinks = graph.links.map(l => ({
            ...l,
            source: (l.source as Node).uri,
            target: (l.target as Node).uri
        }));
        /* tslint:disable-next-line */
        let saveData: SaveData = {
            graphData: {
                links: indexedLinks,
                nodes: graph.nodes
            },
            configData: this.config.getConfigData(),
        };
        const sidebarData = this.sidebar.getData();
        if (sidebarData) {
            saveData.sidebarData = sidebarData;
        }
        const data = btoa(JSON.stringify(saveData));
        const id = uuidv4();
        this.store.saveGraphData(id, data).subscribe(res => {
            // this.pathTracker.next(id);
            this.setPath(id);
        });
        return id;
    }

    /**
     * 
     * @returns 
     */
    getSaveState(): Observable<boolean> {
        return this.savestateconfig.asObservable();
    }


    /**
     * 
     * @param id 
     */
    fetchSavedState(id: string) {
        console.log("called", id);
        this.store.getGraphData(id).subscribe(res => {
            if (res.nodes.length === 0) {
                return null;
            } else {
                this.savestateconfig.next(true);
                const dataString = (res.nodes[0].data["http://10.122.106.18:3000/hasData"] as DataObject).values[0];
                const data: SaveData = JSON.parse(atob(dataString));
                if (data.configData.charge) { this.config.setCharge(data.configData.charge); }
                if (data.configData.weightParamter) { this.config.setWeightParameter(data.configData.weightParamter); }
                if (data.configData.colorMap) { this.config.saveColorMap(data.configData.colorMap); }
                if (data.configData.graph_images_show) {
                    this.config.setImageToggle(true);
                } else { this.config.setImageToggle(false); }
                // if (data.configData.simToggle) { this.config.setSimToggle(true);
                // } else { this.config.setSimToggle(false); }
                if (data.sidebarData) {
                    this.sidebar.setSidebarData(data.sidebarData);
                    // TODO Heighlight links
                    this.sidebar.setCurrentClickedLinkList([]);
                }
                this.store.emitGraphDataTracker(data.graphData);
                this.pathTracker.next(id);
            }
        });
    }

}
