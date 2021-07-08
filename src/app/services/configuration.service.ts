import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import defaultDataJson from "src/app/config_default.json";
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { CookiesService } from './cookies.service';

export class D3ForceConfig {
    charge: number;
    forceCenter: number;
    simulationToogle: boolean;
}
export class ConfigData {
    graph_images_show: boolean;
    outgoing_size_show: boolean;
    outgoing_color_show: boolean;
    incoming_size_show: boolean;
    incoming_color_show: boolean;
    simToggle: boolean;
    charge: number;
    strength: number;
    distance: number;
    weightParamter: string;
    colorMap: Map<Node, string>;
    globalLinkfilter: boolean;
    globalNodefilter: boolean;
}

export class NodeConfig {
    showImage: boolean;
    outgoing_size: boolean;
    outgoing_color: boolean;
    incoming_size: boolean;
    incoming_color: boolean;
    dynamicTarget: boolean;
}

@Injectable({
    providedIn: "root"
})

export class ConfigurationService {

    d3SimulationToggle$ = new Subject<boolean>()
    showColorFilter: boolean;
    showColorFilterUri: boolean;
    showColorFilterLink: boolean;
    
    nodeColorMap: Map<GraphVisualNode, string> = new Map();
    nodeNamespaceColorMap: Map<string, string> = new Map();

    linksColorMap: Map<GraphVisualLink, string> = new Map();

    private _d3ForceConfig: D3ForceConfig;
    private _d3ForceConfig$ = new Subject<D3ForceConfig>();

    private _nodeConfig: NodeConfig;
    private _nodeConfig$ = new Subject<NodeConfig>();

    private weightParameter: Subject<string> = new Subject<string>();
    private imageToggle: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private globalLinkfilter: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private globalNodefilter: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sizeWeightToggle: Subject<string[]> = new Subject<string[]>();
    private colorWeightToggle: Subject<string[]> = new Subject<string[]>();
    private colorMap: BehaviorSubject<Map<Node, string>> = new BehaviorSubject<Map<Node, string>>(new Map<Node, string>());
    public configData: ConfigData;
    private chargeChange: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    /**
     * 
     * @param status 
     * @returns 
     */
    setglobalLinkfilter(status: boolean) {
        return this.globalLinkfilter.next(status);
    }

    /**
     * 
     */
    setglobalNodefilter(status: boolean) {
        return this.globalNodefilter.next(status);
    }

    /**
     * 
     * @returns 
     */
    getConfigData(): ConfigData {
        return this.configData;
    }

    /**
     * 
     * @param param 
     * @param value 
     */
    setParam(param: string, value: boolean) {
        this.configData[param] = value;
        this._cookie.save_setting(param, value);

        if (param == "outgoing_size_show" || param == "incoming_size_show") {
            this.setSizeWeight();
        }
        else {
            this.setColorWeight();
        }
    }

    /**
     * 
     * @param value 
     */
    setCharge(value) {
        this.chargeChange.next(value);
        this.configData.charge = value;
        this._cookie.save_settings({ charge: value });
    }

    /**
     * 
     * @param typeClass 
     * @param color 
     */
    setColorMap(typeClass: Node, color: string) {
        if (typeClass === null && color === "reset") {
            this.colorMap.next(new Map<Node, string>());
        } else {
            const map: Map<Node, string> = this.configData.colorMap;
            map.set(typeClass, color);
            this.colorMap.next(map);
        }
    }

    /**
     * 
     * @param colorMap 
     */
    saveColorMap(colorMap: Map<Node, string>) {
        this.colorMap.next(colorMap);
    }

    /**
     * 
     * @param value 
     */
    setImageToggle(value: boolean) {
        this.configData.graph_images_show = value;
        this._cookie.save_settings({ graph_images_show: value });
        this.imageToggle.next(value);
    }

    /**
     * 
     * @returns 
     */
    getWeightParameter(): Observable<string> {
        return this.weightParameter.asObservable();
    }

    /**
     * 
     * @param param 
     */
    setWeightParameter(param: string) {
        this.configData.weightParamter = param;
        this.weightParameter.next(param);
    }

    /**
     * 
     * @returns Observable
     */
    getColorWeightToggle(): Observable<string[]> {
        return this.colorWeightToggle.asObservable();
    }

    /**
     * 
     * @returns Observable
     */
    getSizeWeightToggle(): Observable<string[]> {
        return this.sizeWeightToggle.asObservable();
    }

    /**
     * 
     * @returns Observable
     */
    getColorMap(): Observable<Map<Node, string>> {
        return this.colorMap.asObservable();
    }

    /**
     * 
     * @returns Observable
     */
    setColorWeight() {
        this.colorWeightToggle.next();
    }

    /**
     * 
     * @returns Observable
     */
    getglobalLinkfilter(): Observable<boolean> {
        return this.globalLinkfilter.asObservable();
    }

    /**
     * 
     * @returns Observable
     */
    getglobalNodefilter(): Observable<boolean> {
        return this.globalNodefilter.asObservable();
    }

    /**
     * 
     * @returns Observable
     */
    getImageToggle(): Observable<boolean> {
        return this.imageToggle.asObservable();
    }

    /**
     * 
     */
    setSizeWeight() {
        // send signal to graph component
        this.sizeWeightToggle.next();
    }

    /**
     * 
     * @param _cookie 
     */
    constructor(private _cookie: CookiesService) {
        this._d3ForceConfig = this._cookie.load_d3ForceConfig_settings();
        this._nodeConfig = this._cookie.load_nodeConfig_settings();

        this._nodeConfig$.subscribe(nodeConfig => {
            this._cookie.save_settings(nodeConfig);
        });

        this._d3ForceConfig$.subscribe(forceConfig => {
            this._cookie.save_settings(forceConfig);
        })
    }

    get d3ForceConfig() { return this._d3ForceConfig }

    get d3ForceConfig$() { return this._d3ForceConfig$.asObservable() }

    get nodeConfig() { return this._nodeConfig }

    set nodeConfig(conf: NodeConfig) {
        this._nodeConfig = conf;
        this._nodeConfig$.next(this._nodeConfig);
    }

    get nodeConfig$() { return this._nodeConfig$.asObservable() }

    get defaultData() { return defaultDataJson; }

    set d3ForceSimulationToggle(toggle: boolean) {
        this._d3ForceConfig.simulationToogle = toggle;
        this._d3ForceConfig$.next(this._d3ForceConfig);
    }

    set d3ForceCharge(charge: number) {
        this._d3ForceConfig.charge = charge;
        this._d3ForceConfig$.next(this._d3ForceConfig);
    }

    set d3ForceCenter(strength: number) {
        this._d3ForceConfig.forceCenter = strength;
        this._d3ForceConfig$.next(this._d3ForceConfig);
    }

    set nodeConfigShowImage(flag: boolean) {
        this._nodeConfig.showImage = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    set nodeConfigOutgoingColor(flag: boolean) {
        this._nodeConfig.outgoing_color = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    set nodeConfigOutgoingSize(flag: boolean) {
        this._nodeConfig.outgoing_size = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    set nodeConfigIncomingColor(flag: boolean) {
        this._nodeConfig.incoming_color = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    set nodeConfigIncomingSize(flag: boolean) {
        this._nodeConfig.incoming_size = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    set nodeConfigDynamicTarget(flag: boolean) {
        this._nodeConfig.dynamicTarget = flag;
        this._nodeConfig$.next(this._nodeConfig);
    }

    /**
     * This function resets the d3Force config by default values from the default configuration
     */
    resetD3ForceConfig() {
        this._d3ForceConfig = {
            charge: this.defaultData.charge,
            forceCenter: this.defaultData.forceCenter,
            simulationToogle: this.defaultData.simulationToogle
        }
        this._d3ForceConfig$.next(this._d3ForceConfig);
    }

    /**
     * This function resets the node configuration by default values from the default configuration
     */
    resetNodeConfig() {
        this._nodeConfig = {
            showImage: this.defaultData.showimage,
            outgoing_size: this.defaultData.outgoing_size,
            outgoing_color: this.defaultData.outgoing_color,
            incoming_size: this.defaultData.incoming_size,
            incoming_color: this.defaultData.incoming_color,
            dynamicTarget: this.defaultData.dynamicTarget,
        }
        this._nodeConfig$.next(this._nodeConfig);
    }
}