import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';
import * as d3 from "d3";
import { GraphVisualService } from 'src/app/services/graphVisual.service';
import { SidebarService } from 'src/app/services/sidebar.service';
import { RequestTypeEnum } from 'src/app/services/backend.api.service';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { FacadeService } from 'src/app/services/facade.service';
import { ProfileService } from 'src/app/services/profile.service';
import { MatDialog } from '@angular/material/dialog';
import { ClassTableDialogComponent } from 'src/app/dialogs/classTable/classtable.dialog';
import { SizeCalculator } from 'src/app/helpers/sizeCalculator.helper';
import appConfig from "src/app/config_default.json";
import { Observable } from 'rxjs';

const LABEL_BG_OFFSET = 20;
const LABEL_BG_RADIUS = 10;
const IMAGE_BACKGROUND_COLOR = "none"
const RDFS_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"

interface SizedEvent {
  width: number;
  height: number;
}
@Component({
  /* tslint:disable-next-line */
  selector: "[nodeVisualNew]",
  templateUrl: "./node-visual.component.html",
  styleUrls: ["./node-visual.component.scss"]
})
export class NodeVisualComponent implements OnInit, AfterViewInit{
  @Input() nodeVisualNew: GraphVisualNode;

  private _labelGroupElement;
  private _nodeElement;
  private _nodeButtonsElement;
  private _imageElement;
  private _clickTimeout = null;
  private _oldSidebarData;
  private _oldhightlighted: string[];
  private _oldhightlightedLinks: string[];
  private _oldhighlightedPath: boolean;
  private _hoverNodeControls: boolean;
  private _imageSize = {
    height: 1,
    weight: 1
  }
  private labelHeight = 0;
  private labelWidth = 0;
 
  constructor( 
             private _configNew: ConfigurationService,
             private _elementRef: ElementRef,
             private graphVisualData: GraphVisualService,
             private sidebarService: SidebarService,
             private _focusMonitor: FocusMonitor,
             private _facadeService: FacadeService,
             private _profile: ProfileService,
             private _dialog: MatDialog) {
  }


  ngAfterViewInit(): void {
    this._labelGroupElement = this._elementRef.nativeElement.querySelector(".labelGroup");
    this._nodeButtonsElement = this._elementRef.nativeElement.querySelector(".nodeButtons");
    this._nodeElement = this._elementRef.nativeElement.querySelector(".nodeClickGroup");
    this._imageElement = this._elementRef.nativeElement.querySelector(`#${this.imageId}`);
    this._hoverNodeControls = false;
  

    const d3element = d3.select(this._nodeElement);
    const d3elementLabel = d3.select(this._labelGroupElement);
    const d3elementSettings = d3.select(this._elementRef.nativeElement.querySelector("#nodeBt_topRight"));
    const d3elementHide = d3.select(this._elementRef.nativeElement.querySelector("#nodeBt_topLeft"));
    const d3elementDelete = d3.select(this._elementRef.nativeElement.querySelector("#nodeBt_bottomRight"))
    const d3elementTable = d3.select(this._elementRef.nativeElement.querySelector("#nodeBt_bottomLeft"))
    // apply hovering over node
    d3.select(this._nodeElement).on("mouseover", () => {this.userHoverNodeStart()}).on("mouseout", () => {this.userHoverNodeEnd()});
    // click events on node element and label
    d3element.on("click", () => {this.userClickedNode()}).on("dblclick",() =>{this.userDoubleClickedNode()}).on("dblclick.zoom", null);
    // d3elementLabel.on("click", () => {this.userClickedNode()}).on("dblclick",() =>{this.userDoubleClickedNode()}).on("dblclick.zoom", null);
    // bind click events on menu buttons
    d3elementSettings.on("mousedown", () => {this.userClickedSettingsBT()})
    d3elementHide.on("mousedown", () => {this.userClickedHideBT()})
    d3elementDelete.on("mousedown", () => {this.userClickedDeleteBT()})
    d3elementTable.on("mousedown", () => {if (this.isClass) this.userClickedTableConfigBT();})

    this._focusMonitor.stopMonitoring(this._nodeElement);

  }

  userHoverSettings() {
    this._hoverNodeControls = true;
    d3.select(this._nodeElement).on("drag", null)
  }

  isSizedEvent(e: any): e is SizedEvent {
    return (e && e.width !== undefined && e.height !== undefined);
  }  

  hashCode(s) {
    for(var i = 0, h = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return h;
  }
  
  labelOverImage: boolean = false;

  ngOnInit(): void {

    // fetch sizes of remote image
    if (this.imageUri) {
      let img = new Image(); 
      img.src = this.imageUri;
      img.onload = (event) => {
        let  loadedImage:any = event.currentTarget;
        this._imageSize.weight = loadedImage.width;
        this._imageSize.height = loadedImage.height;
      } 
    }

    let text = document.getElementById("nodeDummy");
        text.style.fontSize = this.fontSize;
        text.style.width="auto";
        text.style.height="auto";
        text.style.visibility="hidden";
        text.style.position="absolute";
        text.style.whiteSpace="nowrap";
        text.innerHTML = this.shortLabel;

    this.labelWidth = text.clientWidth;
    this.labelHeight = text.clientHeight;

    this.showLabelOverPicture$.subscribe(val => {
      this.labelOverImage = val;
    })
  }
  
  userHoverNodeStart(){
    this._oldhighlightedPath = this.graphVisualData.highlightedPath;
    this._nodeButtonsElement.style = "display: block";
    this._oldSidebarData = this.sidebarService.getData();
    this._oldhightlighted = this.graphVisualData.highlightedNodes;
    this._oldhightlightedLinks = this.graphVisualData.highlightedLinks;
    this.graphVisualData.highlightedPath = false;
    this.graphVisualData.highlightSingleNode(this.nodeVisualNew.uri);
    this.sidebarService.setSidebarData({
      isNode: true,
      data: this.nodeVisualNew
    })

  }

  userHoverNodeEnd(){
    this._nodeButtonsElement.style = "display: none";
    this.sidebarService.setSidebarData(this._oldSidebarData);
    this.graphVisualData.highlightedPath = this._oldhighlightedPath;
    this.graphVisualData.highlightedNodes = this._oldhightlighted;
    this.graphVisualData.highlightedLinks = this._oldhightlightedLinks;
  }

  userClickedSettingsBT() {
    //this._facadeService.fetchAdditional(this.nodeVisualNew.uri, RequestTypeEnum.INCOMING)
    this.graphVisualData.fetchAdditional(this.nodeVisualNew.uri, RequestTypeEnum.INCOMING, this._profile.profileName == "colid");
    console.log("clicked settings...");
  }

  userClickedHideBT() {
    console.log(this.nodeVisualNew)
    this.graphVisualData.hideNode(this.nodeVisualNew);
    console.log("clicked hide...");
  }

  userClickedDeleteBT() {
    console.log(this.nodeVisualNew)
    this.graphVisualData.deleteNode(this.nodeVisualNew);
    console.log("clicked delete...");
  }

  userClickedTableConfigBT() {
    const dialogRef = this._dialog.open(ClassTableDialogComponent, {
      width: "50vw",
      data: this.nodeVisualNew
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log("Closed");
    });
  }

  userClickedNode() {
    console.log("node clicked", this.nodeVisualNew);
    this.graphVisualData.highlightSingleNode(this.nodeVisualNew.uri);
    this._oldhightlighted = this.graphVisualData.highlightedNodes;
    this._oldhightlightedLinks = this.graphVisualData.highlightedLinks;
    this.sidebarService.setSidebarOpen();
    this.sidebarService.setSidebarData({
      isNode: true,
      data: this.nodeVisualNew
    })
    this._oldSidebarData = this.sidebarService.getData();
  }

  userDoubleClickedNode() {
    clearTimeout(this._clickTimeout);
    this._facadeService.fetchAdditional(this.nodeVisualNew.uri, RequestTypeEnum.OUTGOING, this._profile.profileName == "colid")
    //console.log("Node double clicked:", this.nodeVisualNew);
  }

  get isNodeHightlighted() {
    return this.graphVisualData.isHighlightedNode(this.nodeVisualNew.uri);
  }

  get menuButtonWidth() {
    return this.r+this.r/2 > 45 ? this.r+this.r/2 : 45;
  }

  get imageScale() {
    let sizeRelation = this._imageSize.height/this._imageSize.weight;
    
    if (sizeRelation == 1) {
      // img is a square
      return {
        height: 500,
        width: 500
      }
    } else if (sizeRelation < 1) {
      // img width larger then height 
      return {
        height: 500,
        width: 500*(1/sizeRelation)
      }
    } else {
      // img width smaller then height
      return {
        height: 500*(sizeRelation),
        width: 500
      }
    }
  }

  get imageBg() {
    return IMAGE_BACKGROUND_COLOR;
  }
  get imageRadius() {
    return this.r*this._profile.profileData.graph.node.nodeImageShrinkFactor;
  }
  get imageViewBox() {
    return `0 0 ${this.imageScale.height} ${this.imageScale.width}`
  }

  get hasImageShrinkFactor() {
    return this._profile.profileData.graph.node.nodeImageShrinkFactor != 1;
  }

  get imageId() {
    return `image_${this.hashCode(this.nodeVisualNew.uri)}`;
  }

  get menuPath() {
    return  `
    M${this.r},0
    A${this.r},${this.r} 0 0,0 0, -${this.r} 
    L0, -${this.menuButtonWidth}
    A${this.menuButtonWidth},${this.menuButtonWidth} 0 0,1 ${this.menuButtonWidth}, 0
    L${this.r}, 0
    `
  }

  get menuIcon() {
    let x = this.menuButtonWidth != 45 ? this.r*0.75: this.menuButtonWidth*0.4;
    let y = this.menuButtonWidth != 45 ? -this.r : -this.menuButtonWidth*0.6;
    return {
      x,
      y,
      size: this.menuButtonWidth/4+"px"
    }
  }

  get svgGroupTransform() {
    return 'translate(' + this.nodeVisualNew.x + ',' + this.nodeVisualNew.y + ')'
  }

  get x() {
    return this.nodeVisualNew.x;
  }

  get y() {
    return this.nodeVisualNew.y;
  }

  get r() {
    return this.nodeVisualNew.getRadius(this._configNew.nodeConfig.outgoing_size, this._configNew.nodeConfig.incoming_size)
  }

  get showImage(): boolean {
    // show image if config set
    if (this._configNew.nodeConfig.showImage) {
      // show image if either the node has a image or the attached class
      if (this.nodeVisualNew.image != undefined){
        if (this.nodeVisualNew.image.length > 0) {
          return true;
        }
        if(this._profile.profileName == "colid")
        {
          let classNode = this.nodeVisualNew.hiddenOutgoingNodes.find(n => n.predicate === RDFS_TYPE);
          if (classNode != undefined) {
            return this.graphVisualData.nodeDictionary.get(classNode.uri).image.length > 0
          } 
        }       
      }
      
    }
    return false;
  }

  get showLabelOverPicture(): boolean {
    return this.labelOverImage;
  }
  get showLabelOverPicture$(): Observable<boolean> {
    return this._profile.showLabelOverPicture$;
  }

  get isClass(): boolean {
    return this.nodeVisualNew.isClass;
  }

  get fontSize(): string {
    if (this._profile.profileData.graph.node.increaseLabelSize)  
      return (this.r / 20) + "em";
    else return "1em";
  }

  get fontWeight(): number{
    return this.r/20
  }

  get labelBg() {
        return {
          width:this.labelWidth+LABEL_BG_OFFSET, 
          height:this.labelHeight, 
          radius:LABEL_BG_RADIUS,
          transform: `translate(0, ${this.r/4})`
        }
  }

  get color() {
    if (this.nodeVisualNew.outgoingNodes != undefined){
      let myClasses = this.nodeVisualNew.outgoingNodes.filter(n => this.graphVisualData.nodeDictionary.get(n.uri).isClass);
      if (myClasses.length > 0) {
        let myClassNode = this.graphVisualData.nodeDictionary.get(myClasses[0].uri);
        if (this._configNew.nodeColorMap.has(myClassNode)) {
          return this._configNew.nodeColorMap.get(myClassNode);
        }
      } 
    }
    if (this._configNew.nodeNamespaceColorMap.has(this.nodeVisualNew.uriNamespace)) {
      return this._configNew.nodeNamespaceColorMap.get(this.nodeVisualNew.uriNamespace);
    }
    return this.nodeVisualNew.getColor(this._configNew.nodeConfig.outgoing_color, this._configNew.nodeConfig.incoming_color);
  }
  
  

  get fill() {
    if (this.showImage) return `url(#${this.nodeId})`
    else return this.color;
  }

  get nodeId() {;
    return `id_${this.nodeVisualNew.uri}`
  }

  get label(): string {
    let _label = this.nodeVisualNew.nodeLabel;
    if (_label == "Unlabeled Node") {
      let formatUri = this._profile.formatUris;
        if (formatUri) {
          Object.keys(formatUri).forEach(key => {
            if (this.nodeVisualNew.uri.includes(key)) {
              _label = formatUri[key] + ":" +this.nodeVisualNew.uri.replace(key, "");
              this.nodeVisualNew.nodeLabel = _label;
            }
          })
        }
    }
    return _label;
  }

  get shortLabel(): string {
    return SizeCalculator.getClippedNodeLabel(this.label, appConfig.nrClippedCharacters);
  }

  get imageUri(): string {
    if (this.nodeVisualNew.image != undefined){
      if (this.nodeVisualNew.image.length > 0){
        return this.nodeVisualNew.image[this.nodeVisualNew.image.length-1];
      } else if (this._profile.profileName == "colid") {
        let classNode = this.nodeVisualNew.hiddenOutgoingNodes.find(n => n.predicate === RDFS_TYPE)
        if (classNode && this.graphVisualData.nodeDictionary.get(classNode.uri).image.length > 0) {
          return this.graphVisualData.nodeDictionary.get(classNode.uri).image[0];
        }
      }
    }
    return null;
  }

}
