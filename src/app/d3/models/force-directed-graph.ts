import { EventEmitter, AfterViewInit } from "@angular/core";
import { Link } from "./link";
import { Node } from "./node";
import * as d3 from "d3";
import { GraphData } from "src/app/services/triplestore.service";
import { SizeCalculator } from "src/app/helpers/sizeCalculator.helper";
import data from "src/app/config_default.json";

/**
 * the values for DISTANCE, CHARGE, DECAY are loaded in config_default.json
 */
const FORCES = {
  // LINKS: 1,
  // COLLISION: 0.9,
  ALPHA: data.simulation_alpha,
  LINK_DISTANCE: 0,
  LINK_STRENGTH: 0,
  MB_CHARGE: 0,
  DECAY: 0
};

const debug = false;


export class ForceDirectedGraph {
  public ticker: EventEmitter<d3.Simulation<Node, Link>> = new EventEmitter();
  public simulation: d3.Simulation<any, any>;
  public nodes: Node[] = [];
  public links: Link[] = [];
  public classlinks: Link[] = [];
  public options: { width; height };

  constructor(nodes, links, options: { width; height }, force) {
    this.nodes = nodes;
    this.links = links;
    // FORCES.DISTANCE = force;
    this.options = options;
    this.initSimulation(options);
  }

  /**
   * sets the sizes for all nodes
   */
  setNodeSize() {
    this.nodes.forEach(node => {
      SizeCalculator.setNodeSizes(node);
    });
  }

  /**
   * 
   */
  createSimluation() {
    if (debug) console.log("createSimluation");
    // const radius = d3.scaleSqrt().range([0, 10]);

    return this.simulation = d3.forceSimulation()
  }

  /**
   * 
   */
  initNodes() {
    if (debug) console.log("initNodes");
    if (!this.simulation) {
      throw new Error("simulation was not initialized yet");
    }
    this.simulation.nodes(this.nodes);
  }

  // TODO delete if not needed
  initLinks() {
    if (debug) console.log("initLinks");
  }

  /**
   * 
   * @param options
   */
  initSimulation(options) {
    if (debug) console.log("initSimulation");
    if (!options || !options.width || !options.height) {
      throw new Error("missing options when initializing simulation");
    }

    this.setNodeSize();
    /** Creating the simulation */
    if (!this.simulation) {
      const ticker = this.ticker;
      // Creating the force simulation and defining the charges
      this.simulation = this.createSimluation();
      // Connecting the d3 ticker to an angular event emitter
      this.simulation.on("tick", function () {
        ticker.emit(this);
      });

      this.initNodes();
      this.initLinks();
      this.setForces(options);
    }

    /** Restarting the simulation internal timer */
    this.simulation.restart();
  }


  /**
   * Restarting the simulation after updating the forces
   * @param force 
   * @param target 
   */
  updateForce(force, target: string) {
    if (debug) console.log("updateForce"); //debug
    if (target === "linkdistance") {
      FORCES.LINK_DISTANCE = force;
    }
    if (target === "link_strength") {
      FORCES.LINK_STRENGTH = force;
    }
    if (target === "charge") {
      FORCES.MB_CHARGE = -force; // inverted force value because of slider
    }
    // this.simulation = this.createSimluation(); // problem?
    this.startsimulation();
    this.initNodes();
    this.initLinks();
    this.simulation.restart();
    if (debug) console.log("exit updateForce"); //debug
  }


  // Stops the simulation and all included forces
  stopsimulation() {
    if (debug) console.log("simulation stopped"); // debug
    this.simulation.alpha(this.simulation.alphaTarget()); // 
    this.simulation
      .force("charge", null)
      .force("link", null)
      .force("centers", null);
    this.simulation.stop();
  }

  startsimulation() {
    if (debug) console.log("startsimulation"); // debug
    this.simulation.alpha(FORCES.ALPHA);
    // this.simulation.alphaTarget(0.5);
    this.setForces(this.options);
    this.simulation.restart();
    if (debug) console.log("alpha@post= " + this.simulation.alpha());
  }

  /**
   * calls createSimluation, initNodes, initLinks, setNodeSize
   * @param graphData 
   * @param options 
   */
  updateGraph(graphData: GraphData, options) {
    if (debug) console.log("updateGraph");
    // if (debug) console.log("updateGraph"); // debug
    this.nodes = graphData.nodes;
    this.links = graphData.links;

    this.initNodes();
    this.initLinks();
    this.setNodeSize();
    this.setForces(options);

    // if (debug) console.log("exit updateGraph"); // debug
  }

  setForces(options) {
    if (debug) console.log("setForces");
    /** Updating the central force of the simulation */
    this.simulation
      .force("centers",
        d3.forceCenter(options.width / 2, options.height / 2)
      )
      .force("charge", d3.forceManyBody()
        .strength(FORCES.MB_CHARGE)
        // .distanceMax(400)
      )
      .force("link", d3.forceLink(this.links)
        .id((d: Node) => d.uri)
        .distance(() => FORCES.LINK_DISTANCE)
        .iterations(1)
        .strength(FORCES.LINK_STRENGTH)
      );
  }

}
