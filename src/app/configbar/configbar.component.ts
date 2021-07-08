import { Component, ViewChild, ElementRef, OnInit, Input } from "@angular/core";
import { FormControl } from "@angular/forms";
import data from "src/app/config_default.json";
import { Node } from "../d3/models/node";
import { ConfigurationService } from "../services/configuration.service";
import { FacadeService } from "../services/facade.service";

const debug = false;
@Component({
    selector: "config-bar",
    templateUrl: "./configbar.component.html",
    styleUrls: ["./configbar.component.scss"]
})

export class ConfigbarComponent implements OnInit {
    @ViewChild("configbar", { static: true }) configbar: ElementRef;
    @Input() nodes: Node[];

    config_data = data;


    ControlMethod = "settings";


    isOpen = false;
    chargeValue = new FormControl();
    showImage = new FormControl();
    forceCenterValue = new FormControl();
    stopSimulation = new FormControl();

    outgoingSize: boolean;
    outgoingColor: boolean;
    incomingSize: boolean;
    incomingColor: boolean;

    dynamicTarget = false;
    
    
    favoriteQueryType:string;    
    selectedQueryType: "NQuads";

    //'XML', 'JSON' for other query Tpyes at to queryTypes
    queryTypes: string[] = [ 'NQuads'];
    inputQuery: string;

    constructor(private _configNew: ConfigurationService, private facadeService: FacadeService) {
    }

    /**
     * 
     */
    ngOnInit() {
        this.setForceValues();
        this.setVisualizationValues();
    }

    /* D3 Force Configurations */
    setForceValues() {
        this.forceCenterValue.setValue(this._configNew.d3ForceConfig.forceCenter);
        this.chargeValue.setValue(this._configNew.d3ForceConfig.charge);
        this.stopSimulation.setValue(false);
    }


    onChargeChange() {
        this._configNew.d3ForceCharge = this.chargeValue.value;
    }

    onForceCenterChange() {
        this._configNew.d3ForceCenter = this.forceCenterValue.value;
    }

    onSimulationSlideToggle() {
        this._configNew.d3ForceSimulationToggle = !this.stopSimulation.value
        this._configNew.d3SimulationToggle$.next(this._configNew.d3ForceSimulationToggle);
    }

    resetForces() {
        this._configNew.resetD3ForceConfig();
        this.setForceValues();
    }

    plotInput() {
        if(this.inputQuery != null && this.inputQuery.length){
            this.facadeService.fetchGenerateGraphByNquads(this.inputQuery.toString())
            //close side window
            this.configbar.nativeElement.className  = "slideTransitionClose";
            this.isOpen = false;
        }
    }

    set getQuery(value){           
        this.inputQuery = value;
    }

    public getService(){
        return this._configNew;
    }

    /** D3 FORCES END */

    /** Visualization START */
    setVisualizationValues() {
        this.showImage.setValue(this._configNew.nodeConfig.showImage);
        this.outgoingColor = this._configNew.nodeConfig.outgoing_color;
        this.outgoingSize = this._configNew.nodeConfig.outgoing_size;
        this.incomingColor = this._configNew.nodeConfig.incoming_color;
        this.incomingSize = this._configNew.nodeConfig.incoming_size;
        this.dynamicTarget = this._configNew.nodeConfig.dynamicTarget;
    }

    onImageSlideToggle() {
        this._configNew.nodeConfigShowImage = this.showImage.value;
    }

    updateNodeConfig() {
        this._configNew.nodeConfigOutgoingColor = this.outgoingColor;
        this._configNew.nodeConfigOutgoingSize = this.outgoingSize;
        this._configNew.nodeConfigIncomingColor = this.incomingColor;
        this._configNew.nodeConfigIncomingSize = this.incomingSize;
    }

    updateDynamicTarget() {
        this._configNew.nodeConfigDynamicTarget = this.dynamicTarget;
    }

    resetNodeConfig() {
        this._configNew.resetNodeConfig();
        this.setVisualizationValues();
    }


    /** Visualization END */

    /** NODE/LINK START */
    filterClasses() {
        this._configNew.showColorFilter = true;
    }

    filterUris() {
        this._configNew.showColorFilterUri = true;
    }

    hideLinkTypes() {
        console.log("Test");
        this._configNew.showColorFilterLink = true;
    }

    hideNodeTypes() {
        //this.config.setglobalNodefilter(true);
    }

    /** NODE/LINK END */


    openOrCloseBar(newControlMethod: string) {
        if (this.isOpen) {
            if (newControlMethod == this.ControlMethod) {
                this.configbar.nativeElement.className = "slideTransitionClose";
                this.isOpen = false;
            }
        } else {
            this.configbar.nativeElement.className = "slideTransitionOpen";
            this.isOpen = true;
        }
        this.ControlMethod = newControlMethod;
    }
}
