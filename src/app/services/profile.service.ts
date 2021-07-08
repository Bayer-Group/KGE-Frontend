import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TripleStoreService } from './triplestore.service';
import { Profile, Ranking, UriMap } from '../models/profile';
import { map, switchMap } from 'rxjs/operators';
import { Node } from "../d3/models";
import config from "src/app/config_default.json"

declare function require(name: string);

@Injectable({
    providedIn: "root"
})
export class ProfileService {

    profileData: Profile;
    private _profileName: string;

    /**
     * 
     * @param route 
     * @param httpClient 
     * @param tripleStore 
     */
    constructor(private route: ActivatedRoute, private httpClient: HttpClient, private tripleStore: TripleStoreService) {

        //tripleStore.setShowAllFromStart(this.showAll$);
        this._profileName = this.route.snapshot.queryParams["profile"];
        this.fetchProfile(this._profileName).subscribe(res => { this.profileData = res; });
    }

    get profileName(): string {
        return this._profileName;
    }

    get formatUris(): UriMap {
        return this.profileData ? this.profileData.graph.node.formatUris : null;
    }

    get userDefinedFormatUris(): UriMap {
        return this.profileData ? this.profileData.graph.node.userDefinedFormatUris : null;
    }

    get nodeLabels(): string[] {
        return this.profileData ? this.profileData.graph.node.data.showLabel : null;
    }

    get showUnlabeledNodeName(): Observable<boolean> {
        return this.profileConfig$.pipe(
            map(profile => { return !!profile["showUnlabeledNodeName"] })
        )
    }

    get showAll(): Observable<boolean> {
        return this.profileConfig$.pipe(
            map(profile => { return !!profile["showAllFromStart"] })
        )
    }

    get showLabelOverPicture$(): Observable<boolean> {
        return this.profileConfig$.pipe(
            map(profile => {
                return !!profile["showLabelOverPicture"]
            })
        )
    }

    get profile$(): Observable<string> {
        return this.route.queryParams.pipe(
            map(params => {
                this._profileName = params["profile"];
                return params["profile"];
            })
        )
    }

    get profileConfig$(): Observable<Profile> {
        return this.profile$.pipe(
            switchMap(profile => this.fetchProfile(profile))
        )
    }

    get profileLinkList$(): Observable<string[]> {
        return this.profileConfig$.pipe(
            map(profile => this.calculateLinkList(profile))
        )
    }

    /**
     * 
     * @returns 
     */
    getNodeLabelFct$() {
        return this.profileConfig$.pipe(
            map(profile => {
                return node => this.getNodeLabelByProfile(profile, node)
            }))
    }

    /**
     * returns a observable for node label when profile changes
     * @param node the node
     */
    getNodeLabel$(node: Node): Observable<string> {
        // console.log("nodeV getNodeLabel$")
        return this.profileConfig$.pipe(
            map(profile => {
                return this.getNodeLabelByProfile(profile, node)
            })
        )
    }


    /**
     * returns a observable for node tooltip when profile changes
     * @param node 
     */
    getTooltip$(node: Node): Observable<string> {
        return this.profileConfig$.pipe(
            map(profile => {
                // console.log(profile)
                return this.getNodeLabelByProfile(profile, node)
            })
        )
    }


    /**
     * fetch profile config and init custom css styles if configured
     */
    initCustomCssStyles() {
        this.profileConfig$.subscribe(profile => {
            if (profile.customCss) {
                profile.customCss.forEach(c => {
                    document.querySelectorAll<HTMLElement>(c.attributeName).forEach(element => {
                        Object.keys(c.attributes).forEach(key => {
                            element.style[key] = c.attributes[key];
                        })
                    });
                })
            }
        });
    }


    /**
     * 
     * @param link link for which the ranking list has to be passed
     */
    get linkRankingList$(): Observable<Ranking[]> {
        return this.profileConfig$.pipe(
            map(profile => profile.graph.links.rankingList)
        )
    }



    /**
      * 
      * @param node 
      */
    private getNodeLabelByProfile(profile: Profile, node: Node): string {
        let nodeLabelUris = this.nodeLabelByProfile(profile)
        if (!nodeLabelUris) {
            return node.data.mainLabel
        } else {
            for (const nodeLabelUri of nodeLabelUris) {
                if (!!node.data[nodeLabelUri] && !!(node.data[nodeLabelUri])["values"] && !!((node.data[nodeLabelUri])["values"])[0]) {
                    console.log(node.data.mainLabel)
                    return ((node.data[nodeLabelUri])["values"])[0]
                }
            }
            return node.data.mainLabel
        }
    }


    /**
     * 
     */
    private nodeLabelByProfile(profile: Profile): string[] {
        if (!profile) return undefined;
        if (!profile.graph) return undefined;
        if (!profile.graph.node) return undefined;
        if (!profile.graph.node.data) return undefined;

        return profile.graph.node.data["showLabel"];
    }


    /**
     * calculates an allowList of Links that should be displayed, based on the profile config
     * it will emit the linkListTracker
     * @param profileConfig 
     */
    private calculateLinkList(profileConfig: Profile): string[] {
        const graphData = this.tripleStore.getGraph();
        const graphLinks = graphData.links.map(link => { return link.label });
        const uniqueLinks = [...new Set(graphLinks)];
        const allowList: string[] = profileConfig.graph.links.allowList;
        const negativList: string[] = profileConfig.graph.links.negativList;
        const rankingList: Ranking[] = profileConfig.graph.links.rankingList;

        const minLinks: number = profileConfig.graph.links.minLinks;
        const maxLinks: number = profileConfig.graph.links.maxLinks;
        let resultList: string[] = [];

        if (rankingList) {
            uniqueLinks.sort((a, b) => {
                const elemA = rankingList.find(element => element.k == a);
                var prioA = elemA ? elemA.v : config.default_ranking_priority;

                const elemB = rankingList.find(element => element.k == b);
                var prioB = elemB ? elemB.v : config.default_ranking_priority;

                return prioA - prioB;
            })
        }
        // provided: resultList sorted if rankingList exists
        // inset links into resultList from allowList
        if (allowList) {
            uniqueLinks.forEach(link => {
                // if link is in allowlist and resultList is smaller then maxLinks
                if (allowList.indexOf(link) != -1 && (!maxLinks || resultList.length < maxLinks)) {
                    resultList.push(link);
                }
            });
        }

        // if resultList is still smaller then minLinks we need to insert random links if they are not in the negativList
        if (!minLinks || resultList.length < minLinks) {
            uniqueLinks.forEach(link => {
                // if link is not in reusltList and resultList is smaller then minLinks
                if (resultList.indexOf(link) == -1 && (!negativList || negativList.indexOf(link) == -1) && (!minLinks || resultList.length < minLinks)) {
                    resultList.push(link);
                }
            });
        }

        return resultList;
    }


    /**
     * 
     * @param profile 
     */
    private fetchProfile(profile: string): Observable<Profile> {
        if (profile != undefined) {
            return this.httpClient.get<Profile>(`assets/profiles/${profile}.profile.json`);
        }
        else {
            return this.httpClient.get<Profile>(`assets/profiles/default.profile.json`)
        }
    }

}