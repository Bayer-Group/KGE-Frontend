# Knowledge Graph Explorer

In this project a User Interface is implemented using Angular 9.
The interface provides the user with the functionality to search for a specific starting Node in a TripleStore. Using the D3 Framework the TripleStore Data will be displayed as a ForceGraph. The User has the possibility to search inside the Graph and extend the Graph.

# Getting Started

The frontend application docker image would automatically get built by running the `docker-compose up` command in the [Setup](https://github.com/Bayer-Group/COLID-Setup) Project

If you want to manually build the docker image for the Knowledge Graph Explorer frontend application, please use below command.<br />
`docker-compose up --build kge-editor-frontend`

Navigate to http://localhost:4400/ to view the app.

The Angular App is currently running Version: `9.0.4`

In order to run the project locally you need to install npm and the angular/cli.
Follow the [NodeJs](https://nodejs.org/en/) steps described on the official website to install NodeJs.

To install the angular/cli you need to run the following command: `npm install -g @angular/cli`

## Development

Run `ng serve --configuration=local --port=4400` for a dev server. Navigate to `http://localhost:4400/`. The app will automatically reload if you change any of the source files. Please use the set up linting tool to check your code quality. Run `ng lint` to check if your code is matching the code conventions. 
With the configurations set to `local` you need to run the Backend-API locally as well by following instructions [here](https://github.com/Bayer-Group/KGE-Web-service)

Please use the following development steps if you are implementing a new feature for this project:

1. Implement your code
2. Test your code locally
3. Run `ng lint` to check your code quality
4. Update the readme documentation including the technical Architecture using [draw.io](https://www.draw.io/).
5. Commit your code to the Master-Branch to trigger the CI/CD for an automatic deployment.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. 

# Basic Project Structure

The main source code for the Angular Application can be found in the `src/app` directory. 

```
app/
└──configbar/
└──configfilter/
└──config-hide-links/
└──config-hide-nodes/
└──helpers/
|   └──nodeIntersection
└──d3/
|   │   d3.service.ts
|   └───directives/
|   └───models/
└──dialogs/
|   └──plotconfig/
└──models/
|   └──point
|   └──vector
└──pipes/
└──navbar/
└──searchbar/
└──services/
└──sidebar/
└──visuals/
    └───graph/
        └───save/
        └───progress/
    └───shared/
        └───link-visual/
        └───node-visual/
        └───search-visual/
```

The `d3` folder contains all directives, services and models that are directly dealing with the D3 Framework. Therefore no component in the Project needs to call the D3 Framework. Everything that has something to do with D3 will be handled inside this directory.

The `navbar, searchbar, configbar, configfilter, path and sidebar` folders are representing Angular Components. These components are basically the visualisation of the UI in the Browser.

The `dialogs` folder contains all material dialogs that are injected in angular components. They are used to setup the configuration for some tasks.

The `services` folder contains all classes that are used by different components. These services are mainly used for calling APIs and sharing Data between Components. A Service does not have a visual representation in the UI.

In the `visuals` folder you can find all SVG Visuals that are used to display the ForceGraph. It also includes the save component, used to save the graph state. 

The `pipes` folder contains all pipes that are used to transform text.

In the `helpers` folder you can find all helper classes which are used to calculate sizes and intersections.

The `models` folder contains needed Models for the `helpers` folder. 

# Technical Architecture

![Technical_Architecture.png](/doc/technical_architecture.png)

## Components

This section describes the different components and their use in a detailed way.

### app

The App Component is the main entry point for the Angular Application.
It includes the [Navbar Component](#navbar), [Sidebar Component](#sidebar), [Graph Component](#graph), [Configbar Component](#configbar) and the [Searchbar Component](#searchbar).
Note: On default the Searchbar Component is not visible. It will only be visible when you click on the settings icon on the currently highlighted Node.

The Component sets up the [Graph Component](#graph) with the loaded GraphData. It subscribes to the [TripleStore Service](#triplestore) to update the Graph Data whenever new Data has been fetched.

### sidebar

The Sidebar Component shows all additional data for a highlighted node. Therefore it subscribes to the [Sidebar Service](#sidebar-service). The subscribtion gets invoked whenever a node is highlighted by a single click. By default the sidebar is hidden, but the user can toggle it by clicking on a node or the background. The Component iterates over all key in the `Nodes.Data` Object.

### configbar

The Configbar Components includes all functionallity to setup different configurable items. The Component interacts with the [Configuration Service](#configuration-service). It contains a toggle slidebar for displaying images,a toggle sliderbar for stopping the Simulation,a slider for setting the Force manually and two radio buttons to set the parameter that is used to weigh the nodes. Whenever they are toggled, the Sidebar Serive will get notified. The [Node Visual Componant](#node-visual) subscribes to this event and displays the Image if requested. On default it will show the all images. [Graph Component](#graph) subscribes to both the toggle for the Simulation aswell as the Slider for setting the Distance and Decay Force of the Graph. The Simulation is running per default and the Distance is set to 800. The Reset Button brings everything in the configbar back to its default state.

### configfilter

The Configfilter Component has all functionallity to change the color from different selected classes. The Component interacts with the [Configuration Service](#configuration-service). It contains a filter Button for showing the Configfilter Component and functions to set the color Node and the selected class.

### config-hide-links

The ConfighideLinks Components is able to hide all Links by there Types. The Comonent interact with the [Configuration Service](#configuration-service) and the [TripleStore Service](#triplestore) to update the hiddenLinkList.

### config-hide-nodes

The ConfighideNodes Components is able to hide all Links by there Node Types. The Comonent interact with the [Configuration Service](#configuration-service) and the [TripleStore Service](#triplestore) to update the hiddenLinkList.

### navbar

The Navbar Component contains an Autocomplete Input-Field. The Autocomplete will be invoked by typing more then 3 characters. Therefore it subscribes to the [Autocomplete Service](#autocomplete-api) with a debounce time of 300ms. By clicking on the `Plot Button` the Component will invoke the [TripleStore Service](#triplestore) with the selected Node-Uri.

### searchbar

The Searchbar Component gets invoked by a subscribtion to the [Searchbar Service](#searchbar-service). It will fetch the count of all incoming links using the [TripleStore Service](#triplestore). By plotting additional incoming links and nodes it will call the [TripleStore Service](#triplestore) update Method to fetch further nodes and update the GraphData. It is possible to filter the Incoming Nodes using the [Autocomplete Service](#autocomplete-api). If you filter by a specific URI, only one node will be displayed in the UI.

### graph

The Graph Component is the main entry point for the plotting of the D3 ForeGraph using the D3 Framework with SVG Elements. If the Component is initialized it will get a new D3 Graph Object by calling the [D3 Service](#d3) with the passed Nodes and Links from the [App Component](#app). For each Node and Link in the passed Data it will generate an SVG Element with either the type [Link-Visual](#linkVisual) (for all links) and [Node-Visual](#node-visual). For the Node Elements it will setup additonal [Directives](#directives) to setup specific behaviours. Additonally it will create a [Search-Visual](search-visual) SVG Element for each Node containing the [Searchable Directive](#searchable). Furthermore, it subscribes to the [TripleStore Service](#triplestore) `GraphData Tracker` to get notified whenever the GraphData gets updated by adding addtional nodes/links.

After the complete View (SVG) is initiated it will start the ForceGraph Simluation by calling the [D3 Service](#d3). This will setup the Positions for all the Nodes and Links in the SVG Element.

#### link-visual

This component represents the SVG visuals for all links between the nodes. The links are specificed as `SVG:PATH` elements. The component calculated the starting and endposition of the link and sets an arrow to the middle of the path. Additionaly it calculated the position of the link label and sets it to the middle of the link. The position of the arrow will be calculated with the helper class
[nodeIntersection](#nodeIntersection)

#### node-visual

The node-visual component represents the SVG visuals for all nodes. The nodes can either be displayed as oval or as image and their size and color is based on the number of outgoing or incoming links. The different sizes that are used to display the nodes are calculated by the [Size Calculator](#sizeCalculator) It also handles the highlight event by setting an additional stroke color. The component subscribes to the [Sidebar Service](#sidebar-service) to get notified whenever a specific node is clicked. Additional node behaviour such as clicking, dragging etc. are handeled by [directives](#directives)

#### search-visual

The search-visual components represents the small settings SVG that will be displayed whenever a node is highlighted. Therefore it also subscribes to the [Sidebar Service](#sidebar-service). The click behaviour of the icon is handled by a [Searchable Directive](searchable).

#### progress

The progress component is used to display a progress spinner, while the application is sending out http requests. It takes up the whole
window space and lies in front of every other component

#### save

The save component is used to save the current graph state and show the generated id used to access this state. It subscribes to the [Save Service](#save-service) to get the current graph id and to trigger saveCurrentState function.

## dialogs

This sections explains the use of all dialogs.

### plotconfig

This dialog is used to configure the Plotsettings. It allows the user to set additional parameters for plotting a path between two nodes
and set the used triplestore db instance.

## helpers

The helpers folder contains the all helper classes.

### nodeIntersection

This helper class has different calculations for the determination of the Intersectionpoint between Nodes and Links.
For the determination we have to differentiate between Nodes with and without Images . Nodes with Images will be considered as Circle and Nodes without Images as rectangle. Nodes with Images use the [vector](#vector) class for calculations.

### sizeCalculator

The SizeCalculator is used to calculate all the different sizes that are used to display a node. It dynamically increases the size based on the weight that is selected in the configuration (number of outgoing or incoming links).

### hitpointOffset

The HitpointOffsetHelper is used to calculate the arcRadius, axisFlag and new hitpoint to display multiple links that share the same target. It calculates all of this using the duplicateTargetIndex of the given Link.

## Models

The Models folder contains all classes which are needed for the helper class [nodeIntersection](#nodeIntersection)

### point

Point represent a Point with x and y coordinates.

### vector

The vector class offers some function to calculate with vectors.

## Pipes

### highlight

The highlight pipe is used in the [searchbar](#searchbar) component. It takes a text string and a search string as parameter and highlights the text based on the given search. It is used to highlight the text for the incoming link autocomplete.

## Directives

This section covers all implemented directives of this project. The directives are mainly used for the communication between the components and the [D3 Service](#d3). A directive can add extra functionality to a component without replacing the component itself.

### zoomable

The zoomable directive has been applied to the main graph SVG. It applies an overall zoom functionality by setting up the D3 Zoombehaviour using the [D3 Service](#d3).

### clickable

The clickable directive has been applied to all [Node-Visuals](#node-visual). Using the [D3 Service](#d3) it applies the bahaviour for a single and double click. A single click is highlighting the node and a double click is fetching additonal outgoing nodes.

### draggable

The clickable directive has been applied to all [Node-Visuals](#node-visual). It adds the drag behaviour to all nodes using the [D3 Service](#d3).

### searchable

The searchable directive works similiar as the clickable directive but just for a single click. It has been applied to all [Search-Visuals](#search-visual). The click behaviour does not highlight the node. It will open the [Searchbar](#searchbar) by using the [D3 Service](#d3).

## Services

Angular Services are one of the core concepts. The services provides you with functionality to call external APIs and share data between components. They do not have a visual representation in the UI and they are holding the whole logic for calculating and storing data for the UI.

### sidebar-service

The sidebar service holds the data for the [Sidebar Componment](#sidebar). The service provides you with to Observerable to subscribe on. The `sidebarData` observable is going to be invoked whenever a specific node is highlighted.
The service provides functionalities to set the data by calling the setter methods. This will automaticly notify all subscribtions. The sidebarData will be set by the [D3 Service](#d3).

### configuration-service

The configuration service holds all data for different configuration options. The `imageToggle` oberservable will be invoked by the Show Image Toggle Slidebar. And will notify the [Node-Visual Components](#node-visual) to display the Images. The `weightParamter` observable will be invoked by the incoming/outgoing radio buttons and will notify the [Graph Component](#graph), which will reset the node sizes based on the chosen weight parameter.The `filterClassList` and `filterClassColor` observable will be used from the [configfilter](#configfilter) Component to change the Color of the selected class.

### searchbar-service

The searchbar service holds the data for the [Searchbar Componment](#searchbar). The service provides you the functionality to invoke the subscribtions to the `searchbarData`. This will trigger the subscribtion in the Searchbar Component. Additionaly it gives you the functionality to hide the Searchbar Component directly by calling a hide method. This method will emit the searchbarData with pre configured values to hide the searchbar from the UI.

### autocomplete-api

The autocomplete-api service provides you with an observable that can be subscribed on, which is going to call an external Backend-API with a given input string. The obserable will be emitted whenever the Backend-API is responding. This component is used by the [Navbar Component](#navber) to fetch the autocomplete data for the typed input string.

### save-service

The save service provides the functionality to save/fetch a graph state, which is stored in a seperate triplestore. It also provides an observable, which informs the subscribers about the current location path. It decodes/encodes the current ForceDirectedGraph, the current settings and highlighted node and then saves/fetches it to either save it inside the triplestore or display the graph.

### LinkcalculationService

the Link calculation Service provides all needed calclation function for the [Link-Visual](#linkVisual) Component. There are some funktion to calculate the Hitpoint between the Link and the Node. Also functions to change the Visibility for the Delete and Hide Icon.

### NodecalculationService

The Node calculation Services has all needed attributes to calculate the Hitpoint between  [Link-Visual](#linkVisual) and [Node-Visuals](#node-visual) for all different Node Sizes.


### triplestore

The triplestore service is the main service for holding and calculating the GraphData provided by the [Triplestore-API Service](#triplestore-api). The `GraphDataTracker` can be subscribed to get notified whenever the GraphData changed. This has been done in the [App Component](#app). Additionaly it provides you with the functionality to fetch inital GraphData by a given Node-Uri, to fetch additional GraphData for outgoing and incoming links and to fetch the count of incoming links for a specific Node-Uri. By updating the GraphData the service is merging the existing Nodes and Links with the new Data fetched from the Backend-API. In this process the triplestore service is also setting the default node position for all additionaly fetched nodes, so the new nodes will be displayed at the correct position.

#### triplestore-api

The triplestore-api service is an additional module that handels all external calls to the Backend-API for fetching GraphData. Please refer to the Backend OpenAPI Specification at http://localhost:8080/swagger/#/ after building the backend image.

### d3

Everything that handels the D3 Framework has ben capsuled in the D3 Service. The D3 Service provides you the functionalites to add specific behaviours to Graph Element. This is mainly used be all [Directives](#directives). The Graph itself has been provided using an `ForceDirectedGraph Class` that is setting up all the animation and display setting. With the D3 Service you can get an new instantiation of a ForeDirectedGraph Class. It is highly recommend to only use the D3 Service to communicate with the D3 Framework.

# D3 Framework

The [D3 Framework](https://d3js.org/) is used to provide an automaticly binding of data to a Graph visualization. The project is using the framework to provide all kind of animations and setting for displaying Graphs.

## Force Graph

The D3-Force module is providing you with functionaly to automaticly calculate velcoity and forces on elements. Therefore a dynamic Graph can be plotted without any overlapping Nodes/Links. The calculation of Graph physical forces is a highly mathematical solution. The Framework is providing you with all kinds of APIs to work with Graphes without a deep mathematicly understanding. 

Please refer to the [D3-Force Dokumentation](https://github.com/d3/d3-force).

## Data Structure

The D3 Frameworks needs a specific Data Structure to calculate the node and link positions. Therefore we have implemented backend-api to format the TripleStore Data into D3 understandable Structure. Instead of triples the D3 Framework required two sets of arrays. One containing Nodes with addtional data as need, and one with Links that have source and target properties pointing to the exact array index of a specific node.

**Example Data Structure**

```
{
  "nodes": [
    {
      "uri": "http://10.0.0.1:3000/Person",
      "data": {
        "label": "Person"
      }
    },
    {
      "uri": "http://www.w3.org/2000/01/rdf-schema#Class",
      "data": {
        "label": "Class",
        "isClass": true
      }
    }
  ],
  "links": [
    {
      "prettyLabel": "type",
      "label": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      "source": 0,
      "target": 1
    }
  ]
}
```
# Naming conventions

The naming conventions of the html element start with **abbreviation_element-name**. Eg. btn_random-plot. If you don’t find your abbreviation in the list, please add it to the list. Make sure all ids are **unique** in the project.
 
## Abbreviations:
* btn  -  Button  
* cb   -  CheckBox  
* cbl  -  CheckBoxList  
* dd   -  DropDownList  
* div - <div> element
* hl   -  Hyperlink  
* img  -  Image  
* ib   -  ImageButton  
* lbl  -  Label  
* lbtn  - LinkButton  
* lb   -  ListBox  
* lit  -  Literal  
* pnl  -  Panel  
* ph   -  PlaceHolder  
* rb   -  RadioButton 
* rbl  -  RadioButtonList 
* sli – slider
* tb   -  Textbox 
* tgl – toggle

# Profiles

More profiles are being used to store some settings of the application. Their data can be found in JSON files from assets/profiles

## Label settings

The priority list "showLabel" can be changed, to add new uris to take the label from. The uris which appear on top have more priority than the one from back.

"showLabel": [
              "https://pid.bayer.com/kos/19050/hasLabel",
              "https://pid.bayer.com/kos/19050/testLabel"
            ]

# Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

Additionaly the following links could be usefull for fruther research on specific topics:

- [Angular Documentation](https://angular.io/docs)
- [D3-Force Documentation](https://github.com/d3/d3-force)

Feel free to contribute any link you think could be interesting for fruther developers on this project.

