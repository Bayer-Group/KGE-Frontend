import { Component, Input, OnInit, ElementRef, AfterViewInit, Testability } from "@angular/core";
import { GraphVisualLink } from 'src/app/models/graphvisual/graphVisualLink';
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';
import * as d3 from "d3";
import { GraphVisualService } from 'src/app/services/graphVisual.service';
import { SidebarService } from 'src/app/services/sidebar.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ProfileService } from 'src/app/services/profile.service';

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";


@Component({
  /* tslint:disable-next-line */
  selector: "[linkVisual]",
  templateUrl: "./link-visual.component.html",
  styleUrls: ["./link-visual.component.scss"]
})
export class LinkVisualComponent implements OnInit, AfterViewInit {

  @Input() linkVisual: GraphVisualLink;

  private _linkButtonElement;
  private _highlight = false;
  private _textDy = 15;
  private _oldSidebarData;
  private _oldHighlightedNodes;
  private _oldHighlightedLinks;
  lineNode = { x: 0, y: 0 }

  constructor(private _elementRef: ElementRef,
    private _config: ConfigurationService,
    private _graphData: GraphVisualService,
    private _sidebar: SidebarService,
    private _profile: ProfileService) {
  }

  get source(): GraphVisualNode {
    return this.linkVisual.source as unknown as GraphVisualNode // this.facadeService.getVisualNode(this.linkVisual.source)//this.linkVisual.source;
  }

  get target(): GraphVisualNode {
    return this.linkVisual.target as GraphVisualNode//this.facadeService.getVisualNode(this.linkVisual.target) //this.linkVisual.target;
  };

  ngAfterViewInit() {
    this._linkButtonElement = this._elementRef.nativeElement.querySelector(".linkButton");
    d3.select(this._elementRef.nativeElement).on("mouseover", () => { this.userHoverLinkStart() }).on("mouseout", () => { this.userHoverLinkEnd() });
    d3.select(this._elementRef.nativeElement).on("click", () => { this.userClickLink() })
  }

  ngOnInit(): void {
    /* #KGE104
    if (this._profile.profileName == "colid") {
      this._profile.profileConfig$.subscribe(pro => {
        let allowList = pro.graph.links.allowList;
        if (!allowList.includes(this.linkVisual.predicate)) {
          // console.log(this.linkVisual)
          this._graphData.hideLinkFromGraph(this.linkVisual);
        }
      })
    }*/
  }

  userClickLink() {
    if (d3.event.path[0] == this._elementRef.nativeElement.querySelector(".path")
      || d3.event.path[0] == this._elementRef.nativeElement.querySelector(".lineMarker")
      || d3.event.path[0] == this._elementRef.nativeElement.querySelector(".textPath")) {
      // clicked on  link
      console.log("clicked")
      this._sidebar.setSidebarData({
        isNode: false,
        data: this.linkVisual
      })
      this._sidebar.setSidebarOpen();
      this._graphData.highlightSingleLink(this.linkVisual.predicate);
      this._oldSidebarData = this._sidebar.getData();
      this._oldHighlightedNodes = this._graphData.highlightedNodes;
      this._oldHighlightedLinks = this._graphData.highlightedLinks;

    } else {
      if (d3.event.path[0] == this._elementRef.nativeElement.querySelector(".hide")
        || d3.event.path[0] == this._elementRef.nativeElement.querySelector("#menuPathLeft")) {
        // clicked on hide button
        this.userClickHideButton();

      } else {
        // clicked on delete button
        this.userClickDeleteButton();
      }
    }
  }

  userClickHideButton() {

    this._graphData.hideLink(this.linkVisual)
    console.log("user clicked hide button", this.source, this.target);
  }

  userClickDeleteButton() {
    this._graphData.deleteLink(this.linkVisual)
    console.log("user clicked delete button");
  }

  userHoverLinkStart() {
    this._oldSidebarData = this._sidebar.getData();
    this._sidebar.setSidebarData({
      isNode: false,
      data: this.linkVisual
    });
    this._linkButtonElement.style = "display: block";
    this._oldHighlightedNodes = this._graphData.highlightedNodes;
    this._oldHighlightedLinks = this._graphData.highlightedLinks;
    this._graphData.highlightSingleLink(this.linkId)
  }

  userHoverLinkEnd() {
    this._sidebar.setSidebarData(this._oldSidebarData);
    this._linkButtonElement.style = "display: none";
    this._graphData.highlightedNodes = this._oldHighlightedNodes;
    this._graphData.highlightedLinks = this._oldHighlightedLinks;
  }

  get isHighlighted(): boolean {
    if (this._graphData.isHighlightedLink(this.linkId)) {
      return true;
    } else if (this._graphData.highlightedNodes.includes(this.source.uri) && !this._graphData.highlightedPath) {
      return true;
    }
    return this._highlight;
  }

  get label(): string {
    return this.linkVisual.label
  }

  get linkId(): string {
    return `link_${this.linkVisual.predicate}_${this.linkVisual.index}`
  }

  get markerId(): string {
    return `marker_${this.linkVisual.index}`
  }

  get markerUrl(): string {
    return `url(#${this.markerId})`;
  }
  get lineNodeTransform() {
    return `translate(${this.lineNode.x},${this.lineNode.y})`
  }

  get sameDirectionLinkPosition() {
    return this.sameDirectionLinks.findIndex(l => l.predicate == this.linkVisual.predicate);
  }

  get sameDirectionLinks() {
    if (this.source.outgoingNodes == undefined) {
      return []
    }
    return this.source.outgoingNodes.filter(n =>
      n.uri == this.target.uri
    )
  }

  get hasBothDirections() {
    return this.target.outgoingNodes.some(n => n.uri == this.source.uri);
  }

  get textPathHref() {
    return `#${this.linkId}`;
  }

  getNodeRadius(node: GraphVisualNode): number {
    return node.getRadius(this._config.nodeConfig.outgoing_size, this._config.nodeConfig.incoming_size)
  }

  get markerStart(): string {
    if (this.source.x <= this.target.x) return "";
    else return this.markerUrl;
  }

  get isType(): boolean {
    return this.linkVisual.predicate == RDF_TYPE;
  }

  get textDy(): number {
    if (this.source.x > this.target.x && this.sameDirectionLinks.length > 1) return this._textDy;
    else return -this._textDy;
  }


  linkPath(isTextPath): string {


    let sourceX;
    let sourceY;
    let targetY;
    let targetX;
    let sourceR;
    let targetR;
    let outgoing = false;
    let incoming = false;

    sourceX = this.source.x;
    sourceY = this.source.y;
    targetX = this.target.x;
    targetY = this.target.y;


    if (this._config.nodeConfig.outgoing_size != undefined) {
      outgoing = this._config.nodeConfig.outgoing_size
    }
    if (this._config.nodeConfig.incoming_size != undefined) {
      incoming = this._config.nodeConfig.incoming_size
    }

    if (typeof this.target === "string") {
      if (this._graphData.nodeDictionary.get(this.target) == undefined) {
        targetR = 50;
      }
      else {
        targetR = this._graphData.nodeDictionary.get(this.target).getRadius(outgoing, incoming);
      }
    }
    else {
      targetR = this.target.getRadius(outgoing, incoming);
    }

    if (typeof this.source === "string") {
      if (this._graphData.nodeDictionary.get(this.source) == undefined) {
        sourceR = 50;
      }
      else {
        sourceR = this._graphData.nodeDictionary.get(this.source).getRadius(outgoing, incoming);
      }
    }
    else {
      sourceR = this.source.getRadius(outgoing, incoming);
    }


    let curveOff = 0;
    if (sourceX == targetX && sourceY == targetY) {
      sourceX = sourceX;
      targetX = targetX + targetR * 2;
      curveOff = targetR * 2;
    }


    let theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
    var phi = Math.atan((targetY - sourceY) / (targetX - sourceX));

    var sinTheta = sourceR * Math.sin(theta);
    var cosTheta = sourceR * Math.cos(theta);
    var sinPhi = targetR * Math.sin(phi);
    var cosPhi = targetR * Math.cos(phi);

    // Set the position of the link's end point at the source node
    // such that it is on the edge closest to the target node
    if (targetY > sourceY) {
      sourceX = sourceX + sinTheta;
      sourceY = sourceY + cosTheta;
    }
    else {
      sourceX = sourceX - sinTheta;
      sourceY = sourceY - cosTheta;
    }


    // Set the position of the link's end point at the target node
    // such that it is on the edge closest to the source node
    if (sourceX > targetX) {
      targetX = targetX + cosPhi;
      targetY = targetY + sinPhi;
    }
    else {
      targetX = targetX - cosPhi;
      targetY = targetY - sinPhi;
    }

    // mid-point of line:
    var mpx = (targetX + sourceX) * 0.5;
    var mpy = (targetY + sourceY) * 0.5;

    // angle of perpendicular to line:
    var thetaMid = Math.atan2(targetY - sourceY, targetX - sourceX) - Math.PI / 2;

    // distance of control point from mid-point of line:
    this.sameDirectionLinks.length * 125
    let offset = (this.sameDirectionLinks.length - this.sameDirectionLinkPosition - 1) * 125 + 50

    // location of control point:
    var c1x = mpx + offset * Math.cos(thetaMid);
    var c1y = mpy + offset * Math.sin(thetaMid);
    let isSingle = this.sameDirectionLinks.length == 1;

    if (isSingle && !this.hasBothDirections) {
      this.lineNode.x = (sourceX + targetX) / 2
      this.lineNode.y = (sourceY + targetY) / 2
      if (this.source.x > this.target.x && isTextPath) {
        return `M${targetX},${targetY}L${sourceX} ${sourceY}`;
      } else {
        return `M${sourceX},${sourceY}L${targetX} ${targetY}`;
      }
    } else {
      this.lineNode.x = (c1x + mpx) * 0.5;
      this.lineNode.y = (c1y + mpy) * 0.5;
      if (this.source.x > this.target.x && isTextPath) {
        return `M${targetX},${targetY} Q${c1x} ${c1y - curveOff} ${sourceX} ${sourceY}`;
      }
      else if (curveOff != 0) {
        let m0 = (c1y - curveOff + sourceY) / 2;
        let m1 = c1y - curveOff;
        let m2 = (c1y - curveOff + targetY) / 2;
        this.lineNode.y = (2 * m1 + (m0 + m2)) / 4;
        return `M${sourceX},${sourceY} C${sourceX - curveOff} ${c1y - curveOff} ${targetX + curveOff} ${c1y - curveOff} ${targetX} ${targetY}`;
      }
      else {
        return `M${sourceX},${sourceY} Q${c1x} ${c1y} ${targetX} ${targetY}`;
      }
    }
  }
}
