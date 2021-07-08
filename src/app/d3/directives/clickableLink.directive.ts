import { Directive, Input, ElementRef, OnInit } from "@angular/core";
// import { Link } from "../models";
import { D3Service } from "../d3-new.service";
import { ForceDirectedGraph } from '../models/force-directed-graph-new';
import { GraphVisualLink } from 'src/app/models/graphvisual/graphVisualLink';


@Directive({
  selector: "[clickableLink]"
})
export class ClickableLinkDirective implements OnInit {
  @Input() clickableLink: GraphVisualLink;
  @Input() draggableInGraph: ForceDirectedGraph;

  constructor(private d3Service: D3Service, private element: ElementRef) { }

  ngOnInit() {

  }
}
