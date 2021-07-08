import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service"
import { D3ForceConfig, NodeConfig } from './configuration.service';
import defaultData from "src/app/config_default.json";

@Injectable({
    providedIn: "root"
})
export class CookiesService {
    constructor(private _cookieService: CookieService) {
    }

    /**
     * 
     * @param settings 
     */
    save_settings(settings) {
        for (var name in settings) {
            this._cookieService.set(name, settings[name], 365);

        }
    }

    /**
     * 
     * @param name 
     * @param value 
     */
    save_setting(name: string, value: any) {
        this._cookieService.set(name, value, 365);
    }

    /**
     * 
     * @returns 
     */
    load_settings() {

        var allSettings = this._cookieService.getAll();

        for (var name in allSettings) {
            var value = JSON.parse(allSettings[name]);
            allSettings[name] = value;
            // allSettings[name] =; (Boolean) JSON.parse(allSettings[name]);
        }
        return allSettings;
    }

    /**
     * 
     * @returns 
     */
    load_nodeConfig_settings(): NodeConfig {
        var allSettings = this._cookieService.getAll();
        let nodeConfig: NodeConfig = {
            showImage: defaultData.showimage,
            outgoing_size: defaultData.outgoing_size,
            outgoing_color: defaultData.outgoing_color,
            incoming_size: defaultData.incoming_size,
            incoming_color: defaultData.incoming_color,
            dynamicTarget: defaultData.dynamicTarget,
        };

        Object.keys(nodeConfig).forEach(key => {
            try {
                let value = JSON.parse(allSettings[key]);
                nodeConfig[key] = value;
            } catch {
                console.log("no cookies for nodeConfig found");
            }
        })
        return nodeConfig;
    }

    /**
     * 
     */
    load_d3ForceConfig_settings(): D3ForceConfig {
        var allSettings = this._cookieService.getAll();
        let forceConfig: D3ForceConfig = {
            charge: defaultData.charge,
            forceCenter: defaultData.forceCenter,
            simulationToogle: defaultData.simulationToogle
        };

        Object.keys(forceConfig).forEach(key => {
            try {
                let value = JSON.parse(allSettings[key]);
                forceConfig[key] = value;
            } catch {
                console.log("no cookies for force config found");
            }
        })
        return forceConfig;
    }
}