import { ForceDirectedGraph } from "./../../../d3/models/force-directed-graph";
import { SaveService } from "./../../../services/save.service";
import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";

@Component({
    selector: "save-graph",
    templateUrl: "./save.component.html",
    styleUrls: ["./save.component.scss"],
})
export class SaveComponent implements OnInit {
    @Input() graph: ForceDirectedGraph;
    @ViewChild("saveId", { static: true }) saveId;
    path = new FormControl();
    hideInput = true;

    constructor(private save: SaveService) { }

    copyToClip() {
        const element = this.saveId.nativeElement;
        element.select();
        document.execCommand("copy");
    }

    ngOnInit(): void {
        this.save.getPathTracker().subscribe(res => {
            if (res !== "") {
                this.hideInput = false;
                this.path.setValue(`${window.location.href}`);
            } else {
                this.hideInput = true;
            }
        });
    }

    saveGraph() {
        this.save.saveCurrentState(this.graph);
    }

    toggleInput() {
        this.hideInput = !this.hideInput;
    }

    get isPathEmpty() {
        return this.path.value === "";
    }

}
