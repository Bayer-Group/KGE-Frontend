import { Directive, Input, ElementRef, OnInit } from "@angular/core";
import { ForceDirectedGraph } from '../models/force-directed-graph-new';
import { D3Service } from "../d3-new.service";
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';

@Directive({
  selector: "[draggableNode]"
})
export class DraggableDirective implements OnInit {
  @Input() draggableNode: GraphVisualNode;
  @Input() draggableInGraph: ForceDirectedGraph;

  constructor(private d3Service: D3Service, private element: ElementRef) { }

  ngOnInit() {
    this.d3Service.applyDraggableBehaviour(
      this.element.nativeElement,
      this.draggableNode,
      this.draggableInGraph
    );
  }
}
