import { AutocompleteApiService, Autocomplete, AutocompleteData } from "./../services/autocomplete.api.service";
import { TripleStoreService } from "./../services/triplestore.service";
import { Component, OnInit, OnDestroy, ViewEncapsulation, EventEmitter, Output } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Observable, iif, of, from, Subscription } from "rxjs";
import { switchMap, debounceTime, mergeMap, map, distinctUntilChanged, startWith } from "rxjs/operators";
import { SaveService } from "../services/save.service";
import { SidebarService } from "../services/sidebar.service";
import { MatDialog } from "@angular/material/dialog";
import { PlotConfigData, PlotConfigDialogComponent } from "../dialogs/plotconfig/plotconfig.dialog";
import { ShortestPathService } from 'src/app/services/shortestPath.service';
import { DBConfigService, DBConfigRequest } from '../services/dbconfig.service';
import { FacadeService } from '../services/facade.service';
import { GraphVisualNode } from '../models/graphvisual/graphVisualNode';
import { GraphVisualService } from '../services/graphVisual.service';
import appConfig from "src/app/config_default.json";
import { PathConfigData } from "../dialogs/pathconfig/pathconfig.dialog";

@Component({
  selector: "nav-bar",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit, OnDestroy {

  @Output() changeEvent = new EventEmitter<void>(); // c.r.

  nodeInput = new FormControl();
  pathInput = new FormControl();
  bidirectionalSearchToggle = new FormControl(false);
  searchHiddenLinksToggle = new FormControl(false);
  weightedGraphToggle = new FormControl(true);

  startNode = new FormControl();
  destinationNode = new FormControl();

  subscription: Subscription;
  options: any[] = [];
  // this object is used to store the result based on the db, that it came from
  optionsFromDb = {};
  runningRequests = [];
  // autocomplete options for the second navbar
  pathOptions: Observable<Autocomplete[]>;

  // labelAutocompleteOptions: string[] = [];
  labelAutocompleteOptions: GraphVisualNode[] = []
  filteredOptionsStart: Observable<GraphVisualNode[]>;
  filteredOptionsDestination: Observable<GraphVisualNode[]>;

  selectedOption: AutocompleteData = { value: "", link: "", uri: "" };
  selectedPathOption: AutocompleteData;

  loadingAutocomplete = false;

  // uesd to setup the current search method. possible values are "plot" or "path"
  searchMethod = "plot";
  alertText: string = ""
  plotConfig = {
    disableTBox: true,
    bidirectional: true,
    numPaths: 0,
    maxPathLength: 0,
    shortestPath: true,
    pathRange: [0, 1],
    showRange: false
  };

  constructor(private graphVisualService: GraphVisualService,
    private store: TripleStoreService,
    private autoApi: AutocompleteApiService,
    private sidebarService: SidebarService,
    private save: SaveService,
    private dialog: MatDialog,
    public shortestPathService: ShortestPathService,
    private dbConfigService: DBConfigService,
    private facadeService: FacadeService) {
  }

  /**
   * This function opens the PlotConfig Dialog, that is used to configure the selected db's or the path settings and also defines,
   * what should happen if the dialog is closed
   */
  openPlotConfigDialog() {
    const dialogRef = this.dialog.open(PlotConfigDialogComponent, {
      width: "450px",
      data: this.plotConfig,
    });

    dialogRef.afterClosed().subscribe((result: PlotConfigData) => {
      this.plotConfig = result;
    });
  }

  /**
   * This function returns an observable, in which a request is sent to receive autocomplete values for one specific db
   * @param value - Text that is being searched
   * @param db - dbitem, that specifies which triplestore instance, path, namedGraphs and/or virtual graphs will be used for the query
   * @return - array of items, that will be displayed for the autocomplete
   */
  getAutocompleteValue(value: string, db): Observable<Autocomplete[]> {
    // starts the progress circle
    this.loadingAutocomplete = true;
    return this.autoApi.getAutocompleteValuesAsync(value, db, this.dbConfigService.selectedVirtualGraphs);
  }

  /**
   * This function creates an array of dbitems, which will then all be sent for the autocompletion. It takes every selected dbitem from the
   * plotconfig and adds an additional dbitem for every selected virtual graph, so that they can be inside an own request.
   */
  mergeDBWithVirtual() {
    // for every selected virtual graph, add an additional db, because at least one path is required
    // when getting autocomplete values from a virtual graph
    const dbs: DBConfigRequest[] = this.dbConfigService.selectedDBPaths.map(dbpath => {
      return {
        ...dbpath,
        searchInDb: true,
        selectedNamedGraphs: this.dbConfigService.selectedNamedGraphs.get(dbpath),
        virtualGraphs: []
      }
    });
    this.dbConfigService.selectedVirtualGraphs.forEach(vgraph => dbs.push({
      dbpath: this.findPathWithInstance(vgraph.path),
      instance: vgraph.path, // .db
      virtualGraphs: [vgraph.db], // .path
      searchInDb: false,
      selectedNamedGraphs: []
    }));
    return dbs;
  }

  /**
   * Takes an instance name and return the first path that is available for this triplestore instance. This function is used to get a
   * dbpath, that will be used to query a virtual graph.
   * It tries to find paths from the list of selected dbs first.
   * @param instance - selected triplestore instance
   * @returns - a dbpath string
   */
  findPathWithInstance(instance: string): string {

    let db = this.dbConfigService.selectedDBPaths.find(dbitem => {
      return dbitem.instance === instance;
    });
    if (!db) {
      db = this.dbConfigService.dbPaths.find(dbitem => {
        return dbitem.instance === instance;
      });
    }
    return db.dbpath;
  }

  /**
   * This function is used to setup a subscription, that reacts when a value is entered in the searchbar. It makes sure, that after waiting
   * 300ms and if there are more than 3 letters, requests for every selected db are sent and handled correctly.
   */
  setupAutocompleteSubscription() {
    // save the subscription, so that it can be cancelled when the component is destroyed.
    this.subscription = this.nodeInput.valueChanges
      .pipe(
        debounceTime(300),
        // if there are already results for i.e. 'dan' and the user enters 'dani', it does not send requests again if the user
        // types in 'dan' again.
        distinctUntilChanged(),
        // this operator makes sure, that every other subscribtion is cancelled, if the input changes and new requests are sent.
        switchMap(value =>
          // tslint:disable-next-line: no-string-literal
          // do not sent a request, if you click on an option and the input changes.
          iif(() => (value.length > 2 && this.getFormattedValue(this.selectedOption) !== value)
            , from(this.mergeDBWithVirtual()).pipe(
              map((db: DBConfigRequest) => {
                this.options = [];

                // if there are no running requests on the given path, add them to the list
                if (this.runningRequests.findIndex(req => db.virtualGraphs[0] ? req === db.virtualGraphs[0] : req === db.dbpath) === -1) {
                  this.runningRequests.push(db.virtualGraphs[0] || db.dbpath);
                }
                return db;
              }),
              // mergeMap creates observables for every given item, without waiting for any response
              mergeMap((db: DBConfigRequest) =>
                this.getAutocompleteValue(value,
                  {
                    dbpath: db.dbpath, selectedNamedGraphs: db.selectedNamedGraphs,
                    virtualGraph: db.virtualGraphs[0], instance: db.instance
                  }).pipe(
                    map(res => {
                      // take the request response array and add the source db as the last item, it will later be displayed
                      return [[...res], db.virtualGraphs[0] || db.dbpath];
                    })
                  )),
            )
            , of([])
          )
        ),
        // this map function handles every response
        map(val => {
          // val[0] is the incoming response, val[1] contains the dbpath that was in the request
          if (val[1] && val[0]) {
            this.runningRequests.forEach((req, i) => {
              // remove the dbpath from the running requests
              if (req === val[1]) { this.runningRequests.splice(i, 1); }
            });
            // add a key -> value pair with dbpath -> autocompleteResult
            this.optionsFromDb[val[1]] = val[0];
            // every autocomplete value needs to now the path that they came from
            this.optionsFromDb[val[1]].forEach(optionGroup => optionGroup.data.forEach(option => option.db = val[1]));
            this.options = [];
            // fill the options with every response
            // only show options from db's that are selected
            Object.keys(this.optionsFromDb).forEach(opt => {
              if (this.dbConfigService.selectedDBPaths.find(db => db.dbpath === opt)
                || this.dbConfigService.selectedVirtualGraphs.find(vgraph => vgraph.db === opt)) {
                this.options.push(...this.optionsFromDb[opt]);
              }
            });
            if (this.runningRequests.length === 0) {
              this.loadingAutocomplete = false;
            }
          } else if (val.length === 0) {
            // no data was sent
            this.runningRequests = [];
            this.loadingAutocomplete = false;
          }
        })
      )
      .subscribe();
  }

  ngOnInit() {
    this.setupAutocompleteSubscription();
    this.setupAutocompleteGraph();
    this.pathOptions = this.pathInput.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value =>
          iif(() => (value.length > 2)
            , this.autoApi.getAutocompleteValuesAsync(value, this.dbConfigService.selectedDBPaths[0], this.dbConfigService.selectedVirtualGraphs)
            , of([])
          )
        )
      );

    // this.startNode.setValue("hey")
    this.shortestPathService.setWeightedGraph(this.weightedGraphToggle.value);

  }

  /**
   * 
   */
  searchShortestPath() {

    this.setNodeInput(this.startNode, "Starting node does not exist in this graph!")
    this.setNodeInput(this.destinationNode, "Destination node does not exist in this graph!")
    this.checkAlert()
    this.shortestPathService.calculatePath();
  }


  unsetNode(nodeFormCtrl: FormControl) {
    nodeFormCtrl.setValue("");
    if (nodeFormCtrl == this.startNode) {
      this.shortestPathService.setStartNode(null, false)
    } else {
      this.shortestPathService.setDestinationNode(null, false)
    }
    // this.shortestPathService.clearHighlighting()
  }

  setNode(nodeFormCtrl: FormControl) {
    this.shortestPathService.calculatePath()
  }

  /**
   * 
   * @param nodeFormCtrl the form control from which label name is taken
   * @param alertMsg alert message is node is not found
   */
  setNodeInput(nodeFormCtrl: FormControl, alertMsg?: string) {
    let foundNode = nodeFormCtrl.value //this.graphVisualService.nodeDictionary.get(nodeFormCtrl.value.uri) // this.shortestPathService.getNodeWithLabel(nodeFormCtrl.value)
    if (foundNode) {
      if (nodeFormCtrl == this.startNode) {
        this.shortestPathService.setStartNode(foundNode, true)
      } else {
        this.shortestPathService.setDestinationNode(foundNode, true)
      }
    } else if (alertMsg) {
      this.alertText = this.alertText + "\n" + alertMsg;
    }
  }

  onFieldChange(nodeFormCtrl: FormControl) {
    let errMsg = nodeFormCtrl == this.startNode ? "Starting!" : "Destination"
    errMsg += " node does not exist in this graph"
    this.setNodeInput(nodeFormCtrl, errMsg)
    this.checkAlert()
    this.shortestPathService.calculatePath()
  }

  onToggleChange(nodeFormCtrl: FormControl) {
    if (nodeFormCtrl == this.bidirectionalSearchToggle) {
      this.shortestPathService.setBidirectional(this.bidirectionalSearchToggle.value)
    }
    else if (nodeFormCtrl == this.searchHiddenLinksToggle) {
      this.shortestPathService.setUseHiddenLinks(this.searchHiddenLinksToggle.value)
    }
    else if (nodeFormCtrl == this.weightedGraphToggle) {
      this.shortestPathService.setWeightedGraph(this.weightedGraphToggle.value)
    }

    this.shortestPathService.calculatePath()
  }

  /**
   * 
   */
  private setupAutocompleteGraph() {

    this.graphVisualService.graphVisualData$.subscribe(data => {
      this.labelAutocompleteOptions = data.nodes
      this.labelAutocompleteOptions = data.nodes.sort((a, b) => a.nodeLabel.localeCompare(b.nodeLabel))
    })
    this.startNode.setValue("")


    this.filteredOptionsStart = this.startNode.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );

    this.filteredOptionsDestination = this.destinationNode.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      )
  }

  private _filter(value: string): GraphVisualNode[] {

    return this.labelAutocompleteOptions.filter(option => option.nodeLabel.toLowerCase().includes(value.toLowerCase()))
  }

  /**
   * used on plot button press
   * tell the parent to clear data
   */
  clearParentDataSignal() {

    this.changeEvent.emit();
  }

  /**
   * This function fetches the graph data when clicking the plot button.
   */
  fetchGraphData() {

    if (this.nodeInput.value) {
      this.save.setPath("");
      if (this.searchMethod === "plot") {
        this.clearParentDataSignal();
        // this.store.fetchInitialGraphData(this.selectedOption.uri);

        if (this.nodeInput.value == appConfig.character_to_plot_all) {

          this.facadeService.fetchInitial(this.nodeInput.value)
        } else {
          this.facadeService.fetchInitial(this.selectedOption.uri)
        }

        this.sidebarService.setSidebarData(null);
      } else if (this.searchMethod === "path" && this.pathInput.value) {
        this.facadeService.fetchGlobalPath(this.pathConfig, this.selectedOption.uri, this.selectedPathOption.uri)
        //this.store.getFullPathBetweenNodes(this.selectedOption.uri, this.selectedPathOption.uri, this.pathConfig);        
      }
    }
  }
  get pathConfig(): PathConfigData {
    return {
      from: this.selectedOption.uri,
      to: this.selectedPathOption.uri,
      disableTBox: this.plotConfig.disableTBox,
      bidirectional: this.plotConfig.bidirectional,
      numPaths: this.plotConfig.numPaths,
      maxPathLength: this.plotConfig.maxPathLength,
      shortestPath: this.plotConfig.shortestPath,
      pathRange: this.plotConfig.pathRange,
      showRange: this.plotConfig.showRange,
      dbconfig: this.dbConfigService.dbConfigRequest
    }
  }

  /**
   * This function formats autocomplete data, so that they can be displayed in the ui.
   * @param data - one autocomplete result object
   */
  getFormattedValue(data: AutocompleteData): string {
    if (typeof data.value === "object") {
      // special case, as there are some values that for some reason are hidden behind the "_" key.
      // tslint:disable-next-line: no-string-literal
      return `${data.value["_"]} as ${data.link}`;
    } else {
      return `${data.value} as ${data.link}`;
    }
  }

  /**
   * This function starts to fetch random graph data.
   */
  randomGraphData() {
    this.facadeService.fetchRandom(false);
  }

  /**
   * This function sets the selected option, so that it can then be plotted.
   * @param data - autocomplete value that is selected in the ui.
   */
  setSelectedOption(data) {
    this.selectedOption = data;
  }

  /**
   * This function sets the selected path option, which will be used as the 'toUri' when plotting a path.
   * @param data - autocomplete value that is selected in the ui.
   */
  setSelectedPathOption(data) {

    this.selectedPathOption = data;
  }

  isTyping(): boolean {
    return !!this.nodeInput.value;
  }

  isTypingPath(): boolean {
    return !!this.pathInput.value;
  }

  clearInput() {
    this.nodeInput.setValue("");
  }

  clearPathInput() {
    this.pathInput.setValue("");
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  checkAlert(): void {
    if (this.alertText != "") {
      alert(this.alertText)
    }
    this.alertText = "";
  }

  getNodeLabel(node: GraphVisualNode): string {

    return node ? node.nodeLabel : ""
  }
  private display(user): string {
    //access component "this" here
    return user ? user.displayName : user;
  }
}
