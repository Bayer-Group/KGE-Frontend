import { Component } from "@angular/core";
import { TripleStoreService } from "src/app/services/triplestore.service";

@Component({
    selector: "progress-layout",
    templateUrl: "./progress.component.html",
    styleUrls: ["./progress.component.scss"]
})
export class ProgressComponent {

    public show = false;

    constructor(private store: TripleStoreService) {
        this.store.getProgressSpinnerTracker().subscribe(res => this.show = res);
    }

    abortRequest() {
        this.store.abortRequest();
    }
}
