import { MatDialogRef, MAT_DIALOG_DATA} from "@angular/material/dialog";
import { Component, ViewEncapsulation, OnInit, Inject, ViewChild, AfterViewInit } from "@angular/core";
import { GraphVisualNode } from 'src/app/models/graphvisual/graphVisualNode';
import { GraphDataService } from 'src/app/services/graphdata.service';
import { RequestTypeEnum } from 'src/app/services/backend.api.service';
import { ClassTableData, ClassTableService, ClassTable } from 'src/app/services/classtable.service';
import { GraphNode } from 'src/app/models/graphdata/graphNode';
import { FormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Profile } from 'src/app/models/profile';
import { ProfileService } from 'src/app/services/profile.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { DBConfigService } from 'src/app/services/dbconfig.service';

const PREFERED_LANGUAGE = "@en";

@Component({
  selector: "classtable-dialog",
  templateUrl: "classtable.dialog.html",
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["classtable.dialog.scss"],
})
export class ClassTableDialogComponent implements OnInit {
  instanceData: ClassTableData[];
  currentPageData: ClassTableData[];
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  pageSize = 5;
  possibleAttributes: Set<string> = new Set();
  uriDisplayNames: {[key: string]: string};
  attributes = new FormControl();
  apiEndpoint: string;
  currentEditColumn: string;
  newColumnValue: string;
  hasVirtualGraphs = false;


 
  constructor(
    public dialogRef: MatDialogRef<ClassTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GraphVisualNode,
    private _tableService: ClassTableService,
    private _dbConfig: DBConfigService,
    private _clipboard: Clipboard
   ) 
  {
    dialogRef.backdropClick().subscribe(_ => {
      this.dialogRef.close(null);
    });   
  }

  ngOnInit(): void {
    if (this._dbConfig.hasSelectedVirtualGraphs) {
      this.hasVirtualGraphs = true;
      this._tableService.fetchClassTableDataWithVirtualGraph$(this.data.uri,).subscribe(res => {
        this.handleClassTableDataResponse(res);
      });
    } else {
      this._tableService.fetchClassTableData$(this.data.uri).subscribe(res => {
        this.handleClassTableDataResponse(res);
      });
    }
  }

  handleClassTableDataResponse(res: ClassTable) {
    this.instanceData = res.data;
    this.currentPageData = this.instanceData.slice(0, this.pageSize);
    this.possibleAttributes = res.attributes;
    this.fetchLabels(Array.from(res.attributes));
    this.attributes.setValue(["uri"]);
  }

  onClickClose() {
    this.dialogRef.close(null);
  }

  onClickSave() {
    this._tableService.save$(this.data.uri,this.attributes.value, this.uriDisplayNames).subscribe(res => {
      this.apiEndpoint = res.endpoint;
    });
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPageData = this.instanceData.slice(event.pageIndex*this.pageSize, (event.pageIndex+1)*this.pageSize);
    console.log(event, this.currentPageData, this.instanceData);
  }

  fetchLabels(attributes: string[]) {
    this._tableService.fetchLables$(attributes).subscribe(res => {
      let displayNames = {};
      Object.keys(res).forEach(k => {
        let foundPrefferedLanguage = res[k].find(l => l.includes(PREFERED_LANGUAGE));
        displayNames[k] = foundPrefferedLanguage ? foundPrefferedLanguage : res[k][0];
      });
      this.uriDisplayNames = displayNames;
    })
  }

  isEditMode(column: string) {
    return column == this.currentEditColumn;
  }

  enterEditMode(column: string) {
    this.currentEditColumn = column;
  }

  onClickSaveColumnDisplay(column: string) {
    this.uriDisplayNames[column] = this.newColumnValue;
    this.currentEditColumn = null;
    this.newColumnValue = null;
  }

  copyEndpoint() {
    this._clipboard.copy(this.apiEndpoint);
  }

   removeUrlFromString(str: string): string {
    let removedUrl = (str.substr(0, 4) == "http" || str.substr(0, 5) === "https") ? str.substr(str.lastIndexOf("/") + 1, str.length) : str;
    let remvedHash = removedUrl.substr(removedUrl.lastIndexOf("#") + 1, removedUrl.length);
    return remvedHash;
  }
}
