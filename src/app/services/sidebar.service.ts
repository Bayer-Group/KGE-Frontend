import { NodeData } from "../d3/models/node";
import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { LinkData, Link } from "../d3/models/link";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
export class SidebarData {
    isNode?: boolean = false;
    index: number;
    label: string;
    uri: string;
    data: NodeData | LinkData;
    linkList: Link[];
}

export class SidebarDataNew {
    isNode: boolean;
    data: GraphVisualNode | GraphVisualLink;
}
export class ToggleImageData {
    index: number;
    showImage: boolean;
}

@Injectable({
    providedIn: "root"
})

export class SidebarService {
    private sidebarData: BehaviorSubject<SidebarDataNew> = new BehaviorSubject<SidebarDataNew>(null);
    private sidebarOpen: BehaviorSubject<void> = new BehaviorSubject<void>(null);
    private linkList: BehaviorSubject<Link[]> = new BehaviorSubject<Link[]>(null);

    private data: SidebarDataNew;

    constructor() {
    }

    setSidebarData(data: SidebarDataNew) {
        this.data = data;
        this.sidebarData.next(data);
    }

    getSidebarData(): Observable<SidebarDataNew> {
        return this.sidebarData.asObservable();
    }

    setSidebarOpen() {
        this.sidebarOpen.next();
    }

    getSidebarOpen(): Observable<void> {
        return this.sidebarOpen.asObservable();
    }

    getData() {
        return this.data;
    }

    getCurrentClickedLinkList() {
        return this.linkList.asObservable();
    }

    setCurrentClickedLinkList(list: Link[]) {
        this.linkList.next(list);
    }
}
