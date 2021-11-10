import { SaveComponent } from "./visuals/graph/save/save.component";
import { ConfigbarComponent } from "./configbar/configbar.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NavbarComponent } from "./navbar/navbar.component";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { TripleStoreApiService } from "./services/triplestore.api.service";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { D3Service } from "./d3/d3-new.service";
import { DraggableDirective } from "./d3/directives/draggable.directive";
import { ClickableLinkDirective } from "./d3/directives/clickableLink.directive";
import { ZoomableDirective } from "./d3/directives/zoomable.directive";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";
import { MatListModule } from '@angular/material/list';
import { ColorPickerModule } from "ngx-color-picker";
import { ConfigfilterComponent } from "./configfilter/configfilter.component";
import { MatSelectModule } from "@angular/material/select";
import { PlotConfigDialogComponent } from "./dialogs/plotconfig/plotconfig.dialog";
import { PathConfigDialogComponent } from "./dialogs/pathconfig/pathconfig.dialog";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { NouisliderModule } from "ng2-nouislider";
import { ProgressComponent } from "./visuals/graph/progress/progress.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterModule } from '@angular/router';
import { NoCacheHeadersInterceptor } from './NoCacheHeadersInterceptor';
import { GraphComponent } from "./visuals/graph/graph.component";
import { NodeVisualComponent } from './visuals/shared/node-visual/node-visual.component';
import { LinkVisualComponent } from "./visuals/shared/link-visual/link-visual.component";
import { ClassTableDialogComponent } from './dialogs/classTable/classtable.dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ClipboardModule } from '@angular/cdk/clipboard'
import { MatTreeModule } from '@angular/material/tree';
import { ConfigfilterUriComponent } from './configfilter-uri/configfilter-uri.component'
import { ConfigfilterLinkComponent } from './configfilter-link/configfilterlink.component'
import { FilterOverLimitNodeComponent } from "./filterOverLimitNode/filterOverLimitNode.component";
import { FilterBetweenLimitNodeComponent } from "./filterBetweenLimitNode/filterBetweenLimitNode.component";
import { HighlightPipe } from "./pipes/higlight.pipe";
import { AuthenticationModule } from './modules/authentication.module';
import { MsalInterceptor } from "@azure/msal-angular";
import { environment } from "src/environments/environment";

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    NodeVisualComponent,
    LinkVisualComponent,
    NavbarComponent,
    SidebarComponent,
    ConfigbarComponent,
    SaveComponent,
    DraggableDirective,
    ClickableLinkDirective,
    ZoomableDirective,
    ConfigfilterComponent,
    PlotConfigDialogComponent,
    PathConfigDialogComponent,
    ClassTableDialogComponent,
    ProgressComponent,
    FilterOverLimitNodeComponent,
    FilterBetweenLimitNodeComponent,
    ConfigfilterUriComponent,
    ConfigfilterLinkComponent,
    HighlightPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatTooltipModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSliderModule,
    MatListModule,
    MatButtonModule,
    ColorPickerModule,
    MatSelectModule,
    MatDialogModule,
    MatDividerModule,
    NouisliderModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    ClipboardModule,
    MatTreeModule,
    RouterModule.forRoot([]),
    AuthenticationModule.forRoot(),
  ],
  entryComponents: [
    PlotConfigDialogComponent,
  ],
  providers: [
    D3Service,
    TripleStoreApiService,
    {
      provide: HTTP_INTERCEPTORS, //HTTP_INTERCEPTORS,
      useClass: environment.allowAnonymous ? NoCacheHeadersInterceptor:MsalInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
