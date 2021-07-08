import { Component, OnInit, Input } from "@angular/core";
import { SidebarService, SidebarDataNew } from "../services/sidebar.service";
import { FormControl } from "@angular/forms";
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualLink, SidebarOutInLink } from '../models/graphvisual/graphVisualLink';
import { GraphVisualService } from '../services/graphVisual.service';
import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeNestedDataSource } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { ProfileService } from 'src/app/services/profile.service';

interface DataTreeNode {
  prefix: string;
  tooltip?: string;
  value?: string;
  children?: DataTreeNode[];
}

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  prefix: string;
  tooltip?: string;
  value?: string;
  level: number;
}


export class LinkTreeNode {
  children: LinkTreeNode[];
  label: string;
  uri?: string;
  identifier: string;
  targetNode?: GraphVisualNode;
  isLinkElement: boolean;
}

@Component({
  selector: "side-bar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})



export class SidebarComponent implements OnInit {
  @Input() showSidebar: boolean;
  @Input() showLinkVisibility: boolean;

  sidebarData: SidebarDataNew;
  imageSrc: string;
  toppings = new FormControl();
  currentLinkList: GraphVisualLink[];
  allComplete: boolean = false;

  constructor(private sidebarService: SidebarService,
    private graphData: GraphVisualService,
    private profile: ProfileService) {
  }


  ngOnInit(): void {
    this.sidebarService.getSidebarData().subscribe(sidebarData => {
      this.sidebarData = sidebarData;
      if (this.sidebarData && this.sidebarData.isNode) {
        this.createLinkTreeDataSource();
        this.createNodeTreeData();
        this.treeControllerNodeData.expandAll();
      } else {
        this.linkTreeDataSource = null;
      }
      if (this.sidebarData && !this.sidebarData.isNode) {
        this.createNodeTreeData();
        this.treeControllerNodeData.expandAll();
      }
    });
  }

  /*** 
   * helper methodes
   */
  private findPrefix(uri: string): string {
    let result = "Others";
    Object.keys(this.profile.formatUris).forEach(key => {
      if (uri.includes(key) == true) {
        result = this.profile.formatUris[key];
      }
    })
    if (result == "Others") {
      Object.keys(this.profile.userDefinedFormatUris).forEach(key => {
        if (uri.includes(key) == true) {
          result = this.profile.userDefinedFormatUris[key];
        }
      })
    }
    return result;
  }

  private removeUrlFromString(str: string): string {
    let removedUrl = (str.substr(0, 4) == "http" || str.substr(0, 5) === "https") ? str.substr(str.lastIndexOf("/") + 1, str.length) : str;
    let remvedHash = removedUrl.substr(removedUrl.lastIndexOf("#") + 1, removedUrl.length);
    return remvedHash;
  }

  /** 
   * variables that are used for
   * the information tree of node and link
   */
  private _transformer = (node: DataTreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      prefix: node.prefix,
      value: node.value != null ? node.value : null,
      tooltip: node.tooltip != null ? node.tooltip : null,
      level: level,
    };
  }
  treeControllerNodeData = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  dataSourceInfo = new MatTreeFlatDataSource(this.treeControllerNodeData, this.treeFlattener);
  hasChildNodeData = (_: number, node: FlatNode) => node.expandable;

  private createNodeTreeData() {
    this.dataSourceInfo = new MatTreeFlatDataSource(this.treeControllerNodeData, this.treeFlattener);
    let data: DataTreeNode[] = [];
    let prefixList = []
    if (this.sidebarData.isNode) {
      let node = this.sidebarData.data as unknown as GraphVisualNode;
      let dFiltered = node.data.filter(da => !node.image.includes(da.value));
      dFiltered.forEach(da => {
        let prefixType = this.findPrefix(da.predicate)
        if (!prefixList.find(p => p == prefixType)) {
          prefixList.push(prefixType)
          data.push({
            prefix: prefixType, tooltip: da.predicate, children: [
              { prefix: this.removeUrlFromString(da.predicate), value: da.value, tooltip: da.predicate }
            ]
          })
        }
        else {
          data[data.findIndex(p => p.prefix == prefixType)].children.push(
            { prefix: this.removeUrlFromString(da.predicate), tooltip: da.predicate, value: da.value })
        }
      })
    } else {
      let d = this.sidebarData.data as unknown as GraphVisualLink;
      let sourceUri = (d.source as unknown as GraphVisualNode).uri;
      let targetUri = (d.target as unknown as GraphVisualNode).uri;
      data.push({ prefix: 'SourceUri', children: [{ prefix: sourceUri }] })
      data.push({ prefix: 'TargetUri', children: [{ prefix: targetUri }] })
    }
    this.dataSourceInfo.data = data;
  }

  /** End of info tree */

  /** 
   * variables that are used for
   * the outgoing/incoming tree link
   */
  treeControl = new NestedTreeControl<LinkTreeNode>(node => node.children);
  linkTreeDataSource: MatTreeNestedDataSource<LinkTreeNode>;
  linkSelection: SelectionModel<LinkTreeNode> = new SelectionModel<LinkTreeNode>(true);
  OutgoingOrIncomingLink: SidebarOutInLink[] = []

  private createLinkTreeDataSource() {
    let node = this.sidebarData.data as unknown as GraphVisualNode;
    this.linkSelection.clear();
    let mainOutgoingNode: LinkTreeNode = {
      label: "Outgoing",
      isLinkElement: false,
      identifier: "outgoing",
      children: []
    }

    node.outgoingNodes.forEach(n => {
      if (this.graphData.nodeDictionary.get(n.uri) != undefined) {
        let treeNode: LinkTreeNode = {
          label: this.removeUrlFromString(n.predicate),
          uri: n.predicate,
          targetNode: this.graphData.nodeDictionary.get(n.uri),
          isLinkElement: true,
          identifier: node.uri + n.predicate + n.uri,
          children: [],
        }

        let foundNodeSameUri = mainOutgoingNode.children.find(l => l.uri === n.predicate);
        if (foundNodeSameUri) {
          if (foundNodeSameUri.isLinkElement) {
            foundNodeSameUri.isLinkElement = false;
            let newNode: LinkTreeNode = {
              label: "Target: " + foundNodeSameUri.targetNode.nodeLabel,
              targetNode: foundNodeSameUri.targetNode,
              uri: foundNodeSameUri.uri,
              isLinkElement: true,
              identifier: foundNodeSameUri.identifier,
              children: []
            }
            foundNodeSameUri.identifier = foundNodeSameUri.uri + "group";
            foundNodeSameUri.children.push(newNode);
            this.linkSelection.select(newNode);
            this.linkSelection.select(treeNode);
          }
          treeNode.label = "Target: " + treeNode.targetNode.nodeLabel;
          foundNodeSameUri.children.push(treeNode)
          this.linkSelection.select(treeNode);
        } else {
          mainOutgoingNode.children.push(treeNode);
          this.linkSelection.select(treeNode);
        }
      }
    });

    node.hiddenOutgoingNodes.forEach(n => {
      if (this.graphData.nodeDictionary.get(n.uri) != undefined) {
        let treeNode: LinkTreeNode = {
          label: this.removeUrlFromString(n.predicate),
          uri: n.predicate,
          targetNode: this.graphData.nodeDictionary.get(n.uri),
          isLinkElement: true,
          identifier: node.uri + n.predicate + n.uri,
          children: [],
        }
        let foundNodeSameUri = mainOutgoingNode.children.find(l => l.uri === n.predicate);
        if (foundNodeSameUri) {
          if (foundNodeSameUri.isLinkElement) {
            foundNodeSameUri.isLinkElement = false;
            let newNode: LinkTreeNode = {
              label: "Target: " + foundNodeSameUri.targetNode.nodeLabel,
              targetNode: foundNodeSameUri.targetNode,
              uri: foundNodeSameUri.uri,
              isLinkElement: true,
              identifier: foundNodeSameUri.identifier,
              children: []
            }
            foundNodeSameUri.identifier = foundNodeSameUri.uri + "group";
            foundNodeSameUri.children.push(newNode);
          }
          treeNode.label = "Target: " + treeNode.targetNode.nodeLabel;
          foundNodeSameUri.children.push(treeNode)
        } else {
          mainOutgoingNode.children.push(treeNode);
        }
      }
    });

    let mainIncomingNode: LinkTreeNode = {
      label: "Incoming",
      isLinkElement: false,
      identifier: "incoming",
      children: []
    }

    node.incomingNodes.forEach(n => {
      let treeNode: LinkTreeNode = {
        label: this.removeUrlFromString(n.predicate),
        uri: n.predicate,
        targetNode: this.graphData.nodeDictionary.get(n.uri),
        isLinkElement: true,
        identifier: n.uri + n.predicate + node.uri,
        children: [],
      }
      let foundNodeSameUri = mainIncomingNode.children.find(l => l.uri === n.predicate);
      if (foundNodeSameUri) {
        if (foundNodeSameUri.isLinkElement) {
          foundNodeSameUri.isLinkElement = false;
          let newNode: LinkTreeNode = {
            label: "Source: " + foundNodeSameUri.targetNode.nodeLabel,
            targetNode: foundNodeSameUri.targetNode,
            uri: foundNodeSameUri.uri,
            isLinkElement: true,
            identifier: foundNodeSameUri.identifier,
            children: [],
          }
          foundNodeSameUri.children.push(newNode);
          this.linkSelection.select(newNode);
          this.linkSelection.select(treeNode);
          foundNodeSameUri.identifier = foundNodeSameUri.uri + "group";
        }
        treeNode.label = "Source: " + treeNode.targetNode.nodeLabel;
        foundNodeSameUri.children.push(treeNode);
        this.linkSelection.select(treeNode);
      } else {
        mainIncomingNode.children.push(treeNode);
        this.linkSelection.select(treeNode);
      }
    });

    node.hiddenIncomingNodes.forEach(n => {
      let treeNode: LinkTreeNode = {
        label: this.removeUrlFromString(n.predicate),
        uri: n.predicate,
        targetNode: this.graphData.nodeDictionary.get(n.uri),
        isLinkElement: true,
        identifier: n.uri + n.predicate + node.uri,
        children: [],
      }
      let foundNodeSameUri = mainIncomingNode.children.find(l => l.uri === n.predicate);
      if (foundNodeSameUri) {
        if (foundNodeSameUri.isLinkElement) {
          foundNodeSameUri.isLinkElement = false;
          let newNode: LinkTreeNode = {
            label: "Source: " + foundNodeSameUri.targetNode.nodeLabel,
            targetNode: foundNodeSameUri.targetNode,
            uri: foundNodeSameUri.uri,
            isLinkElement: true,
            identifier: foundNodeSameUri.identifier,
            children: [],
          }
          foundNodeSameUri.children.push(newNode);
          foundNodeSameUri.identifier = foundNodeSameUri.uri + "group";
        }
        treeNode.label = "Source: " + treeNode.targetNode.nodeLabel;
        foundNodeSameUri.children.push(treeNode);
      } else {
        mainIncomingNode.children.push(treeNode);
      }
    });

    let dataSource = new MatTreeNestedDataSource<LinkTreeNode>()
    dataSource.data = [];
    if (mainIncomingNode.children.length > 0) {
      dataSource.data.push(mainIncomingNode);
      if (node.hiddenIncomingNodes.length == 0) {
        this.linkSelection.select(mainIncomingNode);
      }
    }
    if (mainOutgoingNode.children.length > 0) {
      dataSource.data.push(mainOutgoingNode);
      if (node.hiddenOutgoingNodes.length == 0) {
        this.linkSelection.select(mainOutgoingNode);
      }
    }
    this.linkTreeDataSource = dataSource;
  }

  hasChild(_: number, node: LinkTreeNode) {
    return node.children != null && node.children.length > 0;
  }

  toggleLinkSelection(node: LinkTreeNode) {
    this.linkSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    if (this.linkSelection.isSelected(node)) {
      this.linkSelection.select(...descendants)
      this.showAllLinkOf(node)
    } else {
      this.linkSelection.deselect(...descendants)
      this.hideAllLinkOf(node)
    }
  }

  toggleLinkLeafSelection(node: LinkTreeNode) {
    this.linkSelection.toggle(node);

    if (this.linkSelection.isSelected(node)) {
      if (!this.graphData.graphVisualData.isLink(this.graphData.linkDictionary.get(node.identifier))) {
        this.showLinkOf(node)
      }
    } else {
      this.hideLinkOf(node)
    }
  }

  descendantsAllSelected(node: LinkTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.linkSelection.isSelected(child)
    );
    return descAllSelected && this.linkSelection.isSelected(node);

  }

  descendantsPartiallySelected(node: LinkTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.linkSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  checkAllParentsSelection(node: LinkTreeNode): void {
    this.linkTreeDataSource.data.forEach(data => {
      this.checkRootNodeSelection(data);
      data.children.forEach(ch => {
        this.checkRootNodeSelection(ch);
      })
    });
  }

  checkRootNodeSelection(node: LinkTreeNode): void {
    const nodeSelected = this.linkSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.linkSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.linkSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.linkSelection.select(node);
    }
  }

  checkLeafNodeSelected(node: LinkTreeNode): boolean {
    return this.linkSelection.isSelected(node);
  }

  hideAllLinkOf(node: LinkTreeNode) {
    let linksToHide: GraphVisualLink[] = [];
    node.children.forEach(ch => {
      if (this.hasChild(0, ch)) {
        ch.children.forEach(ch => {
          linksToHide.push(this.graphData.linkDictionary.get(ch.identifier))
        })
      } else {
        linksToHide.push(this.graphData.linkDictionary.get(ch.identifier))
      }
    })
    linksToHide.forEach(l => {
      this.graphData.hideLink(l);
    })
  }

  hideLinkOf(node: LinkTreeNode) {
    this.graphData.hideLink(this.graphData.linkDictionary.get(node.identifier));
  }

  showAllLinkOf(node: LinkTreeNode) {
    let linksToShow: GraphVisualLink[] = [];
    node.children.forEach(ch => {
      if (this.hasChild(0, ch)) {
        ch.children.forEach(ch => {
          linksToShow.push(this.graphData.linkDictionary.get(ch.identifier))
        })
      } else {

        linksToShow.push(this.graphData.linkDictionary.get(ch.identifier))
      }
    })

    linksToShow.forEach(l => {
      this.graphData.showLink(l);
    })
  }

  showLinkOf(node: LinkTreeNode) {
    this.graphData.showLink(this.graphData.linkDictionary.get(node.identifier));
  }

  firstClick() {
    let sidebarOutgoing: SidebarOutInLink = new SidebarOutInLink;
    sidebarOutgoing.label = 'Outgoing Links'
    sidebarOutgoing.link = [];
    if (this.sidebarData.isNode) {
      let node: GraphVisualNode = this.sidebarData.data as GraphVisualNode
      for (const link of node.outgoingNodes) {
        let rNode = this.graphData.nodeDictionary.get(link.uri)
        if (sidebarOutgoing.link.find(l => l.predicate == link.predicate)) {
          sidebarOutgoing.link[sidebarOutgoing.link.findIndex(l => l.predicate == link.predicate)].node.push(
            { label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: true }
          )
        } else {
          let rLink = this.graphData.linkDictionary.get(node.uri + link.predicate + link.uri)
          sidebarOutgoing.link.push(
            { label: rLink.label, predicate: rLink.predicate, node: [{ label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: true }] }
          )
        }
      }
      // hidden links
      for (const link of node.hiddenOutgoingNodes) {
        let rNode = this.graphData.nodeDictionary.get(link.uri)
        if (sidebarOutgoing.link.find(l => l.predicate == link.predicate)) {
          sidebarOutgoing.link[sidebarOutgoing.link.findIndex(l => l.predicate == link.predicate)].node.push(
            { label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: false }
          )
        } else {
          let rLink = this.graphData.linkDictionary.get(node.uri + link.predicate + link.uri)
          sidebarOutgoing.link.push(
            { label: rLink.label, predicate: rLink.predicate, node: [{ label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: false }] }
          )
        }
      }
      this.OutgoingOrIncomingLink.push(sidebarOutgoing)
      let sidebarIncoming: SidebarOutInLink = new SidebarOutInLink;
      sidebarIncoming.label = 'Incoming Links'
      sidebarIncoming.link = []
      for (const link of node.incomingNodes) {
        let rNode = this.graphData.nodeDictionary.get(link.uri)
        if (sidebarIncoming.link.find(l => l.predicate == link.predicate)) {
          sidebarIncoming.link[sidebarIncoming.link.findIndex(l => l.predicate == link.predicate)].node.push(
            { label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: true }
          )
        } else {
          let rLink = this.graphData.linkDictionary.get(node.uri + link.predicate + link.uri)
          sidebarIncoming.link.push(
            { label: rLink.label, predicate: rLink.predicate, node: [{ label: rNode.nodeLabel, linkUri: node.uri + link.predicate + link.uri, checked: true }] }
          )
        }
      }
      // hidden links
      for (const link of node.hiddenIncomingNodes) {
        let rNode = this.graphData.nodeDictionary.get(link.uri)
        if (sidebarIncoming.link.find(l => l.predicate == link.predicate)) {
          sidebarIncoming.link[sidebarIncoming.link.findIndex(l => l.predicate == link.predicate)].node.push(
            { label: rNode.nodeLabel, linkUri: link.uri + link.predicate + node.uri, checked: false }
          )
        } else {
          let rLink = this.graphData.linkDictionary.get(link.uri + link.predicate + node.uri)
          sidebarIncoming.link.push(
            { label: rLink.label, predicate: rLink.predicate, node: [{ label: rNode.nodeLabel, linkUri: link.uri + link.predicate + node.uri, checked: false }] }
          )
        }
      }
      this.OutgoingOrIncomingLink.push(sidebarIncoming)
    }
  }
  /** End of link tree */

  /**
   * geta seta methodes
   */
  get title() {
    if (this.sidebarData) {
      if (this.sidebarData.isNode) {
        return "Node";
      } else {
        return "Link";
      }
    } else {
      return "";
    }
  }

  get label() {
    if (this.sidebarData.isNode) {
      let d = this.sidebarData.data as unknown as GraphVisualNode;
      return d.nodeLabel;
    } else {
      return (this.sidebarData.data as unknown as GraphVisualLink).label;
    }
  }

  get uri() {
    if (this.sidebarData.isNode) {
      let d = this.sidebarData.data as unknown as GraphVisualNode;
      return d.uri;
    } else {
      return (this.sidebarData.data as unknown as GraphVisualLink).predicate;
    }
  }

  get hasImage() {
    if (this.sidebarData.isNode) {
      let d = this.sidebarData.data as unknown as GraphVisualNode;
      return d.image.length > 0;
    } else return false;
  }

  get image() {
    let d = this.sidebarData.data as unknown as GraphVisualNode;
    return d.image[0];
  }
}
