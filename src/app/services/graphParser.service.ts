import { Injectable } from '@angular/core';
import { GraphNode } from '../models/graphdata/graphNode';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { RequestTypeEnum } from './backend.api.service';
import isImageUrl from 'is-image-url';
import { GraphDataNew } from '../models/graphdata/graphdata';
import { GraphVisualData } from '../models/graphvisual/graphVisualData';
import { GraphVisualLink } from '../models/graphvisual/graphVisualLink';
import { Profile } from '../models/profile';
import appConfig from "src/app/config_default.json";
import { GraphRelatedNode } from '../models/GraphRelatedNode';

const unlabeled_node = "Unlabeled Node";

@Injectable({
  providedIn: 'root'
})
export class GraphParserService {
  private _profile: Profile;
  private _nodeDictionary: Map<string, GraphVisualNode>;
  private _linkDictionary: Map<string, GraphVisualLink>;

  constructor() { }

  get nodeDictionary() {
    return this._nodeDictionary;
  }

  get linkDictionary() {
    return this._linkDictionary;
  }

  /**
   * set the current profile needed in parse methodes
   * @param profile Profile
   */
  public SetProfile(profile: Profile): void {
    this._profile = profile;
  }

  /**
   * return link.source or uri from GraphVisualNode
   * @param link GraphVisualLink
   * @returns string
   */
  getSourceUri(link: GraphVisualLink) {
    let uri = link.source
    if (typeof uri != "string") {
      uri = uri.uri
    }
    return uri
  }

  /**
   * return link.target or uri from GraphVisualNode
   * @param link GraphVisualLink
   * @returns string
   */
  getTargetUri(link: GraphVisualLink) {
    let uri = link.target
    if (typeof uri != "string") {
      uri = uri.uri
    }
    return uri
  }

  /**
   * return node.uri or getUri() from GraphVisualNode
   * @param node 
   * @returns string
   */
  getRelatedNodeUri(node: GraphRelatedNode) {
    let uri = node.uri
    if (typeof uri != "string") {
      uri = node.getUri()
    }
    return uri
  }

  public getLabelByUri(uri: string): string {
    let name = uri.split("/");
    if (name.length > 1) {
      if (name[name.length - 1] == "")
        return name[name.length - 2];
      return name[name.length - 1];
    }
    return "";
  }

  public isClassPredicate(predicate: string): boolean {
    return predicate == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" ||
      predicate == "http://www.w3.org/2000/01/rdf-schema#subClassOf"
  }

  public isClassSubject(subject: string): boolean {
    return subject == "http://www.w3.org/2002/07/owl#Class" ||
      subject == "http://www.w3.org/2000/01/rdf-schema#Class"
  }

  /**
   * get last part of the giving url as string if a url is existing
   * otherwise it will return the string as it is
   * @param uri url string
   * @returns string
   */
  public getStringFromUri(uri: string): string {
    let removedUrl = (uri.substr(0, 4) == "http" || uri.substr(0, 5) === "https") ? uri.substr(uri.lastIndexOf("/") + 1, uri.length) : uri;
    let remvedHash = removedUrl.substr(removedUrl.lastIndexOf("#") + 1, removedUrl.length);
    return remvedHash;
  }


  public nodeLabelByprofile(profile: Profile): string[] {
    if (!profile) return undefined;
    if (!profile.graph) return undefined;
    if (!profile.graph.node) return undefined;
    if (!profile.graph.node.data) return undefined;
    return profile.graph.node.data["showLabel"];
  }

  public getNodeLabelByprofile(node: GraphNode): string {
    let nodeLabelUris = this.nodeLabelByprofile(this._profile)
    if (nodeLabelUris) {
      for (const nodeLabelUri of nodeLabelUris) {
        let foundData = node.data.find(data => data.predicate === nodeLabelUri)
        if (foundData) {
          return foundData.value;
        }
      }
    }
    if (this._profile.showUnlabeledNodeName)
      return unlabeled_node
    else
      return this.getLabelByUri(node.uri);
  }

  public isNodeClass(node): boolean {
    return this.isClassSubject(node.uri) ||
      node.outgoingNodes.some(linkInfo => this.isClassPredicate(linkInfo.predicate) && this.isClassSubject(linkInfo.uri)) ||
      node.incomingNodes.some(linkInfo => this.isClassPredicate(linkInfo.predicate))
  }

  public getLinkRank(linkUri: string): number {
    if (!!this._profile.graph.links.rankingList) {
      let foundPriorityObj = this._profile.graph.links.rankingList.find(obj => obj.k == linkUri)
      if (foundPriorityObj) {
        return foundPriorityObj.v
      }
    }
    return appConfig.default_ranking_priority
  }
  

  //IMPORTENT Dont use this for visual links or nodes
  public _mergeUnique(firstList: any[], secondList: any[]): any[] {
    let combined = firstList.concat(...secondList)
    const uniq = new Set(combined.map(e => JSON.stringify(e)));
    return Array.from(uniq).map(e => JSON.parse(e));
  }


  /**
   * merge additionalGraph to existingGraph
   * @param additionalGraph GraphVisualData
   * @param existingGraph  GraphVisualData
   * @param nodeDictionary Map<string, GraphVisualNode>
   * @param linkDictionary Map<string, GraphVisualLink>
   * @returns GraphVisualData
   */
  public mergeGraphData(additionalGraph: GraphVisualData, existingGraph: GraphVisualData,
    nodeDictionary: Map<string, GraphVisualNode>, linkDictionary: Map<string, GraphVisualLink>): GraphVisualData {

    this._nodeDictionary = nodeDictionary;
    this._linkDictionary = linkDictionary;

    additionalGraph.nodes.forEach(node => {
      let existingNode: GraphVisualNode = nodeDictionary.get(node.uri)
      if (!existingNode) {
        existingGraph.nodes.push(node)
        this._nodeDictionary.set(node.uri, node);
      } else if (existingGraph.isHiddenNode(node.uri)) {
        existingGraph.showHiddenNode(existingNode)
        existingNode = this.mergeNodeData(existingNode, node)

      } else if (existingGraph.isDeletedNode(node.uri)) {
        existingGraph.hideDeletedNode(existingNode)
        existingNode = this.mergeNodeData(existingNode, node)

      } else {
        existingNode = this.mergeNodeData(existingNode, node)
      }
    })

    additionalGraph.hiddenNodes.forEach(hiddenNode => {
      let existingHiddenNode: GraphVisualNode = nodeDictionary.get(hiddenNode.uri)
      if (!existingHiddenNode) {
        existingGraph.hiddenNodes.push(hiddenNode)
        this._nodeDictionary.set(hiddenNode.uri, hiddenNode)
      } else {
        if (existingGraph.isNode(existingHiddenNode.uri)) {
          existingHiddenNode.outgoingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isNode(existingNode.uri)) {
              existingHiddenNode.showLinksToNode(n)
            }
          })
          existingHiddenNode.incomingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isNode(existingNode.uri)) {
              existingHiddenNode.showLinksFromNode(n)
            }
          })
        } else if (existingGraph.isDeletedNode(existingHiddenNode.uri)) {
          existingGraph.hideDeletedNode(existingHiddenNode)
          existingHiddenNode.deletedOutgoingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isDeletedNode(existingNode.uri)) {
              existingHiddenNode.hideLinksFromDeletedNode(n)
            }
          })
          existingHiddenNode.deletedIncomingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isDeletedNode(existingNode.uri)) {
              existingHiddenNode.hideLinksToDeletedNode(n)
            }
          })
        }
        existingHiddenNode = this.mergeNodeData(existingHiddenNode, hiddenNode)
      }
    })

    //IMPORTANT: Change this after you make the deletedLink-Component
    additionalGraph.deletedNodes.forEach(deletedNode => {
      let existingDeletedNode: GraphVisualNode = nodeDictionary.get(deletedNode.uri)
      if (!existingDeletedNode) {
        existingGraph.deletedNodes.push(deletedNode)
        this._nodeDictionary.set(deletedNode.uri, deletedNode)
      } else {
        if (existingGraph.isNode(existingDeletedNode.uri)) {
          existingDeletedNode.outgoingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isNode(existingNode.uri)) {
              existingDeletedNode.showLinksToNode(n)
              existingNode.showLinksFromNode(n)
              // newGraphData.showLinks (newGraphData.deletedLinks.filter(l => existingDeletedNode.uri === l.source && existingNode.uri === l.target), this._nodeDictionary)
            }
          })
          existingDeletedNode.incomingNodes.forEach(n => {
            let existingNode = nodeDictionary.get(n.uri)
            if (existingGraph.isNode(existingNode.uri)) {
              existingDeletedNode.showLinksFromNode(n)
              existingNode.showLinksToNode(n)
            }
          })
        }
        existingDeletedNode = this.mergeNodeData(existingDeletedNode, deletedNode)
      }
    })

    additionalGraph.links.forEach(l => {
      let existingLink: GraphVisualLink = this._linkDictionary.get(l.source + l.predicate + l.target)
      if (!existingLink) {
        this._linkDictionary.set(this.getSourceUri(l) + l.predicate + this.getTargetUri(l), l)
        existingGraph.hiddenLinks.push(l)
      }
    })

    additionalGraph.hiddenLinks.forEach(l => {
      let existingLink: GraphVisualLink = this._linkDictionary.get(l.source + l.predicate + l.target)
      if (!existingLink) {
        this._linkDictionary.set(this.getSourceUri(l) + l.predicate + this.getTargetUri(l), l)
        existingGraph.hiddenLinks.push(l)
      }

    })

    //IMPORTANT: Change this after you make the deletedLink-Component
    additionalGraph.deletedLinks.forEach(l => {
      let existingLink: GraphVisualLink = this._linkDictionary.get(l.source + l.predicate + l.target)
      if (!existingLink) {
        this._linkDictionary.set(this.getSourceUri(l) + l.predicate + this.getTargetUri(l), l)
        existingGraph.hiddenLinks.push(l)
      } else {
        existingGraph.hideDeletedLinks([existingLink], this._nodeDictionary)
      }
    })

    let newShowLinks: GraphVisualLink[] = []
    existingGraph.hiddenLinks.forEach(hl => {
      if (existingGraph.isNode(this.getSourceUri(hl)) && existingGraph.isNode(this.getTargetUri(hl))) {
        newShowLinks.push(hl)
      }
    })
    existingGraph.showLinks(newShowLinks, this._nodeDictionary)
    return existingGraph;
  }

  /**
   * merge firstList with secondList
   * @param firstList GraphRelatedNode[]
   * @param secondList GraphRelatedNode[]
   * @returns GraphRelatedNode[]
   */
  private mergeRelatedNode(firstList: GraphRelatedNode[], secondList: GraphRelatedNode[]): GraphRelatedNode[] {
    let list: GraphRelatedNode[] = []
    firstList.forEach(fn => {
      if (!list.find(li => this.getRelatedNodeUri(fn) === this.getRelatedNodeUri(li) && fn === li)) {
        list.push(fn)
      }
    })
    secondList.forEach(sn => {
      if (!list.find(li => this.getRelatedNodeUri(sn) === this.getRelatedNodeUri(li) && sn === li)) {
        list.push(sn)
      }
    })

    return list;
  }

  /**
   * merge newNode to existNode
   * @param existNode GraphVisualNode
   * @param newNode GraphVisualNode
   * @returns GraphVisualNode
   */
  private mergeNodeData(existNode: GraphVisualNode, newNode: GraphVisualNode): GraphVisualNode {
    if (existNode.nodeLabel === unlabeled_node) {
      existNode.nodeLabel = newNode.nodeLabel
    }
    existNode.outgoingNodes = this.mergeRelatedNode(existNode.outgoingNodes, newNode.outgoingNodes)
    existNode.hiddenOutgoingNodes = this.mergeRelatedNode(existNode.hiddenOutgoingNodes, newNode.hiddenOutgoingNodes)
    existNode.hiddenOutgoingNodes = this.mergeRelatedNode(existNode.deletedOutgoingNodes, newNode.hiddenOutgoingNodes)

    existNode.outgoingNodes.forEach(oN => {
      existNode.hiddenOutgoingNodes = existNode.hiddenOutgoingNodes.filter(hON => this.getRelatedNodeUri(oN) != this.getRelatedNodeUri(hON)
       || oN.predicate != hON.predicate)
    })

    existNode.incomingNodes = this.mergeRelatedNode(existNode.incomingNodes, newNode.incomingNodes)
    existNode.hiddenIncomingNodes = this.mergeRelatedNode(existNode.hiddenIncomingNodes, newNode.hiddenIncomingNodes)
    existNode.hiddenIncomingNodes = this.mergeRelatedNode(existNode.hiddenIncomingNodes, newNode.deletedIncomingNodes)
    existNode.incomingNodes.forEach(iN => {
      existNode.hiddenIncomingNodes = existNode.hiddenIncomingNodes.filter(hIN => this.getRelatedNodeUri(iN) != this.getRelatedNodeUri(hIN) 
      || iN.predicate != hIN.predicate)

    })
    existNode.data = this._mergeUnique(existNode.data, newNode.data)
    existNode.image = this._mergeUnique(existNode.image, newNode.image)
    return existNode
  }

  /**
   * parse input GraphDataNew to GraphVisualData
   * that means this methode parse all the information together
   * to GraphVisualData 
   * @param input GraphDataNew
   * @param isAdditional boolean - is true when call came from Additional fetch 
   * @param currentType RequestTypeEnum - direction of links to parse "incomming, outgoin or all"
   * @param baseNodeUri string
   * @param inputDictionary Map<string, GraphNode>
   * @returns GraphVisualData
   */
  public parseToGraphDataVisual(input: GraphDataNew, isAdditional: boolean,
    currentType: RequestTypeEnum, baseNodeUri: string, inputDictionary: Map<string, GraphNode>): GraphVisualData {
    let baseNode = inputDictionary.get(baseNodeUri)
    let nodes = input.nodes
    if (currentType === RequestTypeEnum.INCOMING) {
      nodes = [baseNode].concat(baseNode.incomingNodes.map(linkInfo => linkInfo.uri).map(uri => inputDictionary.get(uri)))
    } else if (currentType === RequestTypeEnum.OUTGOING) {
      nodes = [baseNode].concat(baseNode.outgoingNodes.map(linkInfo => linkInfo.uri).map(uri => inputDictionary.get(uri)))
    }

    // let permittedLinks = this.calculateLinkList()
    nodes = this._mergeUnique([], nodes)
    //create visual nodes
    let visualNodes: GraphVisualNode[] = []    
    let hiddenVisualNodes: GraphVisualNode[] = []

    visualNodes = nodes.map(node => {
      let visualNode = new GraphVisualNode;
      visualNode.nodeLabel = this.getNodeLabelByprofile(node)
      visualNode.uri = node.uri;
      visualNode.isClass = this.isNodeClass(node)
      visualNode.hiddenIncomingNodes = []
      visualNode.hiddenOutgoingNodes = []
      visualNode.outgoingNodes = []
      visualNode.incomingNodes = []
      visualNode.data = []
      visualNode.image = []
      //add images from input.nodes.data to visual nodes
      node.data.forEach(dataElement => {
        if (isImageUrl(dataElement.value)) {
          visualNode.image.push(dataElement.value)
        }
        visualNode.data.push(dataElement)
      });
      //create base node
      if (node.uri === baseNodeUri || currentType == RequestTypeEnum.ALL 
        || currentType == RequestTypeEnum.GLOBALPATH) {
        for (let relatedNode of node.outgoingNodes) {
          if (!isAdditional || currentType == RequestTypeEnum.ALL 
            || currentType == RequestTypeEnum.GLOBALPATH) {
            visualNode.outgoingNodes.push(relatedNode)
          } else {
            visualNode.hiddenOutgoingNodes.push(relatedNode)
          }
        }
        for (let relatedNode of node.incomingNodes) {
          if (currentType == RequestTypeEnum.ALL 
            || this.getRelatedNodeUri(relatedNode) == baseNodeUri
            || currentType == RequestTypeEnum.GLOBALPATH) {
            visualNode.incomingNodes.push(relatedNode)
          } else {
            visualNode.hiddenIncomingNodes.push(relatedNode)
          }
        }
      } 
      //create normal nodes which are connected to base node
      else {
        if (node.incomingNodes.find(n => n.uri == baseNodeUri)) {
          for (let relatedNode of node.incomingNodes) {
            if (!isAdditional) {
              visualNode.incomingNodes.push(relatedNode)
            } else {
              visualNode.hiddenIncomingNodes.push(relatedNode)
            }
          }
        }

        if (node.outgoingNodes.find(n => n.uri == baseNodeUri)) {
          for (let relatedNode of node.outgoingNodes) {
              visualNode.hiddenOutgoingNodes.push(relatedNode)          
          }
        }
      }
      return visualNode;
    })
    //hide nodes without links
    visualNodes = visualNodes.filter(vn => {
      if (vn.incomingNodes.length == 0 && vn.outgoingNodes.length == 0 && vn.uri != baseNodeUri) {
        hiddenVisualNodes.push(vn)
        return false
      }
      return true;
    })
    //create visual links
    let hiddenVisualLinks: GraphVisualLink[] = []
    let visualLinks: GraphVisualLink[] = []
    if (currentType === RequestTypeEnum.INCOMING) {
      hiddenVisualLinks = input.links.filter(link => link.source === baseNodeUri || link.target === baseNodeUri).map(link => {
        return {
          predicate: link.predicate, source: link.source, target: link.target,
          isType: this.isClassPredicate(link.predicate), label: this.getStringFromUri(link.predicate),
          rank: this.getLinkRank(link.predicate)
        };
      })

    } else if (currentType === RequestTypeEnum.OUTGOING) {
      if (isAdditional) {
        hiddenVisualLinks = input.links.map(link => {
          return {
            predicate: link.predicate, source: link.source, target: link.target,
            isType: this.isClassPredicate(link.predicate), label: this.getStringFromUri(link.predicate),
            rank: this.getLinkRank(link.predicate)
          }
        })
      } else {
        visualLinks = input.links.filter(link => link.source === baseNodeUri).map(link => {
          return {
            predicate: link.predicate, source: link.source, target: link.target,
            isType: this.isClassPredicate(link.predicate), label: this.getStringFromUri(link.predicate),
            rank: this.getLinkRank(link.predicate)
          };
        })
      }
    } else {
      visualLinks = input.links.map(link => {
        return {
          predicate: link.predicate, source: link.source, target: link.target,
          isType: this.isClassPredicate(link.predicate), label: this.getStringFromUri(link.predicate),
          rank: this.getLinkRank(link.predicate)
        };
      })
    }
    //build new Graph Visual Data
    return new GraphVisualData(visualNodes, hiddenVisualNodes, visualLinks, hiddenVisualLinks);
  }
}
