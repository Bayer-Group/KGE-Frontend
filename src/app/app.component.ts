import { SaveService } from "./services/save.service";
import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { trigger, transition, animate } from "@angular/animations";
import { SidebarService } from "./services/sidebar.service";
import { ActivatedRoute } from "@angular/router";
import { ProfileService } from './services/profile.service';
import { RequestTypeEnum } from './services/backend.api.service';
import { GraphVisualService } from './services/graphVisual.service';
import { FacadeService } from './services/facade.service'
import { GraphVisualData } from './models/graphvisual/graphVisualData';
import { ConfigurationService } from "./services/configuration.service";
import { AuthService } from './modules/authentication/services/auth.service';


@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  // use angular animations to be able to call functions on animation start/end.
  animations: [
    trigger("toggleSidebar", [
      transition("isOpen => closed", [
        animate(".25s")
      ]),
      transition("closed => isOpen", [
        animate(".25s")
      ]),
    ])
  ]
})
export class AppComponent implements OnInit /*AfterViewInit*/ {
  @ViewChild("flexbox", { static: true }) flexbox: ElementRef;
  title = "dataVisual";
  data: GraphVisualData//GraphData;

  // controls if sidebar is isOpened/closed
  isOpen = false;
  // controls if sidebar information is shown
  showSidebar = false;
  showLinkVisibility = false;
  ControlMethod = "settings";
  constructor(
    private sidebarService: SidebarService,
    private _config: ConfigurationService,
    private _graphVisual: GraphVisualService,
    private save: SaveService,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private facadeService: FacadeService,
    private _authService: AuthService
  ) {
  }

  /*
    ngAfterViewInit(): void {
      setTimeout(() => {
        this.facadeService.fetchInitial("http://pid.bayer.com/kos/19014/1/ggvcm");
      }, 500)
    }
  */
  ngOnInit() {
    //this._authService;
    this._authService.currentName$.subscribe(res => {
      console.log("Current User Name ",res)
    });
    
    this._graphVisual.graphVisualData$.subscribe(res => {
      this.data = res;
    });

    this.facadeService.graphVisualData$.subscribe(
      res => {
        // console.log("graphVisualData")
        // console.log(res);
        this.data = res
        // console.log(this.graphdata.nodeDictionary);
      },
      error => console.log("there was an error by calling the backend", error)
    )
    //this.nquadsService.fetchNquads("http://pid.bayer.com/kos/19014/1/ggvcm", RequestTypeEnum.OUTGOING);

    this.profileService.initCustomCssStyles();
    this.sidebarService.getSidebarOpen().subscribe(() => {
      this.isOpen = true;
    }
    );

    this.isOpen = false;
    const path = window.location.pathname.replace("/", "");
    if (path) {
      this.save.fetchSavedState(path);
    }

    this.route.queryParams.subscribe(params => {
      const baseNode = params["baseNode"];
      if (baseNode) {
        console.log("Fetch inital GraphData for baseNode:", baseNode)
        this.profileService.profile$.subscribe(profile => {
          this._graphVisual.fetch(baseNode, RequestTypeEnum.ALL, true);
        });
      }
    });
    // on start, the app component subscribes to the graphDataTracker to get notified, when graph data is loaded, because the app component
    // acts as the main component, which passes the data to every other component.
    // this.tripleStore.getGraphDataTracker().subscribe(
    //   data => this.data = data,
    //   error => console.log("there was an error by calling the backend", error)
    // );
    this.facadeService.graphVisualData$.subscribe(
      data => this.data = data,
      error => console.log("there was an error by calling the backend", error)
    )

  }

  /**
   * Sets showSidebar to false and therefore hides the sidebar component. It is called when the animation to isOpen the sidebar starts.
   */
  animStart() {
    this.showSidebar = true;
    this.showLinkVisibility = false;

  }

  /**
   * Sets showSidebar to true and therefore shows the sidebar component, if the sidebar is isOpening
   * param {event, that is passed when the animation ends} event
   */
  animEnd(event) {
    // only show the sidebar on animation end when the sidebar has finished isOpening
    if (event.toState === "isOpen") {
      if (this.ControlMethod == "showSidebar") {
        this.showSidebar = true;
      } else if (this.ControlMethod == "LinkVisibility") {
        this.showLinkVisibility = true;
      }

    }
  }

  /**
   * clears the graph from the screen
   */
  clearData() {
    // console.log("[appComp] clearData()");
    this.data = null;
  }

  get showColorFilter() {
    return this._config.showColorFilter;
  }
  get showColorFilterUri() {
    return this._config.showColorFilterUri;
  }
  get showColorFilterLink(){
    return this._config.showColorFilterLink;
  }

  openOrCloseBar(newControlMethod: string) {

    if (newControlMethod == "showSidebar") {
      this.showSidebar = true;
      this.showLinkVisibility = false;
    } else if (newControlMethod == "LinkVisibility") {
      this.showSidebar = false;
      this.showLinkVisibility = true;
    } else {
      this.showSidebar = false;
      this.showLinkVisibility = false;
    }
    if (this.isOpen) {

      if (newControlMethod == this.ControlMethod) {
        this.flexbox.nativeElement.className = "slideTransitionClose";
        this.isOpen = false;
      }
    } else {
      this.flexbox.nativeElement.className = "slideTransitionOpen";
      this.isOpen = true;
    }
    this.ControlMethod = newControlMethod;
  }
}
