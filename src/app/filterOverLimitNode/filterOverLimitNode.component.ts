import { Observable, iif, of } from "rxjs";
import { FilterOverLimitNodeService } from "../services/filterOverLimitNode.service";
import { Component, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { FormControl } from "@angular/forms";
import { debounceTime, switchMap, startWith } from "rxjs/operators";
import appConfig from "src/app/config_default.json";
import { ProfileService } from '../services/profile.service';
import { MatSelectionList } from "@angular/material/list"
import { MatAutocomplete } from '@angular/material/autocomplete';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';

export class NodeOption {
  uri: string;
  incomingLinkUri: string;
  name: string;
  constructor(name, uri, linkUri) {
    this.name = name;
    this.uri = uri;
    this.incomingLinkUri = linkUri;
  }
}

export class LinkOption {
  uri: string;
  name: string;
  count: number;
  constructor(name, uri) {
    this.name = name;
    this.uri = uri;
    this.count = 1;
  }
}

class AutocompleteData {
  link: string;
  uri: string;
  value: string;
}

@Component({
  selector: 'filterOverLimitNode',
  templateUrl: './filterOverLimitNode.component.html',
  styleUrls: ['./filterOverLimitNode.component.scss']
})
export class FilterOverLimitNodeComponent implements AfterViewInit {

  @ViewChild("searchbar", { static: true }) searchOutgoingAll: ElementRef;
  @ViewChild("autocompleteInput", { static: true }) autocompleteInput: ElementRef;
  @ViewChild("auto", { static: true }) auto: MatAutocomplete;
  @ViewChild("selectedLinkURIsList") selectedLinkURIsList: MatSelectionList;

  searchInput = new FormControl();
  selectedOutgoingNodes = new FormControl();
  allFormNodeOptions: NodeOption[] = [];
  filteredFormNodeOptions: NodeOption[] = [];

  selectedLinkTypes: LinkOption[] = [];

  options: Observable<AutocompleteData[]>;

  // selectedOutgoingNodes.value : NodeOption[] = [];

  startNode: GraphVisualNode;
  nodeDictionary: Map<string, GraphVisualNode>;
  linkDictionary: Map<string, GraphVisualLink>;
  isOutgoing: boolean;
  // getNodeLabel = x => x;

  maxSelectableNodes = appConfig.limit_warning;

  constructor(private filterOverLimitNodeService: FilterOverLimitNodeService,

    private profileService: ProfileService) { }


  ngAfterViewInit() {
    this.autocompleteInput.nativeElement.focus();
    this.filterOverLimitNodeService.getDataObservable().subscribe(data => {
      this.isOutgoing = data.isOutgoing;
      if (data.show) {
        this.startNode = data.node;
        this.nodeDictionary = data.nodeDictionary;
        this.linkDictionary = data.linkDictionary;

        this.selectedLinkTypes = []

        if (data.isOutgoing) {
          this.startNode.hiddenOutgoingNodes.forEach(relNode => {
            let foundOption = this.selectedLinkTypes.find(linkOption => linkOption.uri === relNode.predicate)
            if (foundOption) {
              foundOption.count++;
            } else {
              this.selectedLinkTypes.push(
                new LinkOption(this.linkDictionary.get(this.startNode.uri + relNode.predicate + relNode.uri).label,
                  relNode.predicate)
              )
            }
          })
          this.allFormNodeOptions = data.node.hiddenOutgoingNodes
            .map(relNode =>
              this.createNodeOption(relNode.uri, relNode.predicate))
          //TODO: Change this after the delete link list integrated into the frontend
          /* this.startNode.deletedOutgoingNodes.forEach(relNode => {
            let foundOption = this.selectedLinkTypes.find(linkOption => linkOption.uri === relNode.predicate)
            if (foundOption) {
              foundOption.count++;
            } else {
              this.selectedLinkTypes.push(
                new LinkOption(this.linkDictionary.get(this.startNode.uri+relNode.predicate+relNode.uri).label, 
                                relNode.predicate)
              )
            }
          })
          this.allFormNodeOptions = this.allFormNodeOptions.concat(data.node.deletedOutgoingNodes
            .map(relNode =>
              this.createNodeOption(relNode.uri, relNode.predicate))) */


        } else {
          this.startNode.hiddenIncomingNodes.forEach(relNode => {
            let foundOption = this.selectedLinkTypes.find(linkOption => linkOption.uri === relNode.predicate)
            if (foundOption) {
              foundOption.count++;
            } else {
              this.selectedLinkTypes.push(
                new LinkOption(this.linkDictionary.get(relNode.uri + relNode.predicate + this.startNode.uri).label,
                  relNode.predicate)
              )
            }
          })

          this.allFormNodeOptions = data.node.hiddenIncomingNodes
            .map(relNode =>
              this.createNodeOption(relNode.uri, relNode.predicate))

        }



        this.updateFilterFormNodeOptions(this.allFormNodeOptions)

        this.show(data.node)
      } else {
        this.close()
      }
    });


  }

  updateFilterFormNodeOptions(newList: NodeOption[]) {
    this.filteredFormNodeOptions = newList
      .filter((option, idx) => newList.findIndex(opt => opt.uri == option.uri) == idx)
  }

  onLinkTypeSelectionChange() {

    let linkTypeAllowList = this.selectedLinkURIsList.selectedOptions.selected.map(option => option.value);

    this.updateFilterFormNodeOptions(
      this.allFormNodeOptions.filter(nodeOption => linkTypeAllowList.find(linkUri => linkUri == nodeOption.incomingLinkUri))
    )
    // console.log(this.filteredFormNodeOptions)
    let newSelected = this.selectedOutgoingNodes.value.filter(opt => this.filteredFormNodeOptions.find(o => o == opt))
    this.selectedOutgoingNodes.setValue(newSelected)
  }

  getFormattedValue(data: AutocompleteData): string {
    return `${data.value} as ${data.link}`;
  }

  hideSearchbar(uris: string[] = []) {
    this.filterOverLimitNodeService.hide({ show: false, node: this.startNode, uris: uris, isOutgoing: this.isOutgoing });
  }

  fetchAllOutgoingNodes() {
    let childrenURIs: string[] = this.selectedOutgoingNodes.value.map(elem => elem.uri);
    // this.newGraphData.nodes = this.newGraphData.nodes.filter(node => node.uri == this.startNode.uri || childrenURIs.find(uri => uri==node.uri ) )
    // this.newGraphData.links = this.newGraphData.links.filter(link => childrenURIs.find(uri => uri==link.target)  )

    // this.searchOutgoingAllService.hide({show:false, node:this.startNode, uris: [] });
    this.hideSearchbar(childrenURIs)
  }

  onOptionAdd(option: NodeOption) {
    if (this.selectedOutgoingNodes.value.length > appConfig.limit_show_list) {
      this.showForbidAddAlert()
      this.selectedOutgoingNodes.setValue(this.selectedOutgoingNodes.value.filter(opt => opt != option));
    }
  }

  private showForbidAddAlert() {
    alert("Maximal number of selected nodes exceeded! Please delete some or plot first!")
  }

  getWarning(): string {
    return this.selectedOutgoingNodes.value.length >= appConfig.limit_warning ? 'Warning: adding more nodes before plotting can break the interface'
      : ''
  }

  onAutocompleteFocusOut() {
    // this.auto.
    // console.log("focusIn!")
    // this.auto.setValue([])
    this.setupAutocomplete()
  }

  onOptionSelect(data) {
    this.addNodeOption(data.value, data.uri)
    this.searchInput.reset()
  }

  /**
   * 
   * @param name 
   * @param uri 
   */
  private addNodeOption(name: string, uri: string) {
    if (this.selectedOutgoingNodes.value.length + 1 <= appConfig.limit_show_list) {
      if (!this.selectedOutgoingNodes.value.find(opt => opt.uri == uri)) {
        let foundOption = this.allFormNodeOptions.find(option => option.uri == uri)
        if (foundOption) {
          this.selectedOutgoingNodes.setValue(this.selectedOutgoingNodes.value.concat(foundOption));
        }
      }

    } else {
      this.showForbidAddAlert()
    }
  }

  removeNodeOption(option: NodeOption) {
    this.selectedOutgoingNodes.setValue(this.selectedOutgoingNodes.value.filter(opt => opt.name != option.name))
  }

  /**
   * 
   */
  getOutgoingNodeCount() {
    return this.filteredFormNodeOptions.length // this.newGraphData.nodes.length;
  }

  getstartNodeLabel() {
    return this.startNode.nodeLabel
  }

  /**
   * shows the current window
   * @param node 
   */
  private show(node: GraphVisualNode) {
    this.searchOutgoingAll.nativeElement.style.display = "block";
    this.startNode = node;
    this.searchInput.setValue("");
    this.selectedOutgoingNodes.setValue([])

    this.setupAutocomplete();
    setTimeout(() => {
      this.autocompleteInput.nativeElement.focus();
    }, 100);
  }

  /**
   * close the current window
   */
  private close() {
    this.searchOutgoingAll.nativeElement.style.display = "none";
    this.startNode = null;
    this.options = null;
  }

  private setupAutocomplete() {
    this.options = this.searchInput.valueChanges
      .pipe(
        startWith(""),
        debounceTime(300),
        switchMap(value =>
          iif(() => (value.length > 1)
            , this.getAutocompleteData$(value)

            , null
          )
        )
      );
    // this.autocomplete.getAutocompleteAdditionalValuesAsync
    //             (value, this.startNode.uri, this.getExcludedAutocompleteURI() , 
    //             this.store.selectedDBs,  this.store.selectedVirtualGraphs)
  }

  getAutocompleteData$(value: string): Observable<AutocompleteData[]> {
    let autocompleteData: AutocompleteData[] = []
    if (this.isOutgoing) {
      autocompleteData = this.startNode.hiddenOutgoingNodes.map(relNode => ({
        value: this.nodeDictionary.get(relNode.uri).nodeLabel,
        link: this.linkDictionary.get(this.startNode.uri + relNode.predicate + relNode.uri).label,
        uri: relNode.uri
      })).filter(obj => obj.value.toLowerCase().search(value.toLowerCase()) > -1)
    } else {
      autocompleteData = this.startNode.hiddenIncomingNodes.map(relNode => ({
        value: this.nodeDictionary.get(relNode.uri).nodeLabel,
        link: this.linkDictionary.get(relNode.uri + relNode.predicate + this.startNode.uri).label,
        uri: relNode.uri
      })).filter(obj => obj.value.toLowerCase().search(value.toLowerCase()) > -1)
    }

    return of(autocompleteData)
  }

  private createNodeOption(nodeUri: string, linkUri: string): NodeOption {
    // let nodeIncommingLink = this.newGraphData.links.find(link => link.target == node.uri)
    return new NodeOption(this.nodeDictionary.get(nodeUri).nodeLabel, nodeUri, linkUri)
  }

  /**
   * get the uri-s from selected children and children of node existing in the graph
   */
  getLinkDirection(): string {
    if (this.isOutgoing) {
      return "Outgoing"
    } else {
      return "Incoming"
    }
  }


}
