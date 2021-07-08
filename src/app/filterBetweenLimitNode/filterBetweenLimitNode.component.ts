import { Component, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { MatSelectionList } from "@angular/material/list"
import { FormControl } from '@angular/forms';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualData } from '../models/graphvisual/graphVisualData';
import { FilterBetweenLimitNodeService } from "../services/filterBetweenLimitNode.service";

export class NodeOption {
  uri: string;
  name: string;
  constructor(name, uri) {
    this.name = name;
    this.uri = uri;
  }
}

@Component({
  selector: 'filterBetweenLimitNode',
  templateUrl: './filterBetweenLimitNode.component.html',
  styleUrls: ['./filterBetweenLimitNode.component.scss']
})
export class FilterBetweenLimitNodeComponent implements AfterViewInit {

  @ViewChild("searchbar", { static: true }) searchOutgoingAll: ElementRef;
  @ViewChild("selectedURIsList") selectedURIsList: MatSelectionList;

  selectAllToggle = new FormControl(false);

  startNode: GraphVisualNode;
  newGraphData: GraphVisualData;
  existingGraphData: GraphVisualData;
  isOutgoing: boolean;

  selectedOutgoingNodes: NodeOption[] = [];

  constructor(private  FilterBetweenLimitNodeService:  FilterBetweenLimitNodeService) { }


  ngAfterViewInit() {
    this. FilterBetweenLimitNodeService.getDataObservable().subscribe(data => {
      this.isOutgoing = data.isOutgoing
      if (data.show) {
        this.show(data.node, data.nodeDictionary)
      } else {
        this.close()
      }
    });

  }


  hideSearchbar() {
    this. FilterBetweenLimitNodeService.hide({ show: false, node: this.startNode, isOutgoing: this.isOutgoing });
  }

  filterOutgoingNodes() {
    let childrenURIs: string[] = this.selectedURIsList.selectedOptions.selected.map(option => option.value);
    //  childrenURIs.push(this.startNode.uri)

    this. FilterBetweenLimitNodeService.hide({ show: false, node: this.startNode, uris: childrenURIs, isOutgoing: this.isOutgoing })
  }

  getNrNewNodes(): number {
    return this.selectedOutgoingNodes.length;
  }
  getLinkDirection(): string {
    if (this.isOutgoing) {
      return "Outgoing"
    } else {
      return "Incoming"
    }
  }


  /**
   * shows the current window
   * @param node 
   */
  private show(startNode: GraphVisualNode, nodeDictionary) {
    this.searchOutgoingAll.nativeElement.style.display = "block";
    this.startNode = startNode;
    if (this.isOutgoing) {
      this.selectedOutgoingNodes = startNode.hiddenOutgoingNodes.map(relatedNode =>
        new NodeOption(nodeDictionary.get(relatedNode.uri).nodeLabel, relatedNode.uri))
      //TODO: Change this after the delete link list integrated into the frontend
      /* this.selectedOutgoingNodes = this.selectedOutgoingNodes.concat(startNode.deletedOutgoingNodes.map(relatedNode => 
        new NodeOption(nodeDictionary.get(relatedNode.uri).nodeLabel, relatedNode.uri))) */
    } else {
      this.selectedOutgoingNodes = startNode.hiddenIncomingNodes.map(relatedNode =>
        new NodeOption(nodeDictionary.get(relatedNode.uri).nodeLabel, relatedNode.uri))
      //TODO: Change this after the delete link list integrated into the frontend
      /* this.selectedOutgoingNodes = this.selectedOutgoingNodes.concat(startNode.deletedIncomingNodes.map(relatedNode => 
        new NodeOption(nodeDictionary.get(relatedNode.uri).nodeLabel, relatedNode.uri)))  */
    }
    this.selectedOutgoingNodes = this.selectedOutgoingNodes.filter((option, idx) => this.selectedOutgoingNodes.findIndex(opt => opt.uri == option.uri) == idx)
  }

  /**
   * close the current window
   */
  private close() {
    this.searchOutgoingAll.nativeElement.style.display = "none";
    this.newGraphData = null;
    this.existingGraphData = null;
    this.selectedURIsList.selectedOptions.clear()
  }


}
