// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  allowAnonymous: true,
  apis : {
    graphData: {
      outgoing: "http://localhost:9090/graphData/outgoing",
      outgoingAdditonal: "http://localhost:9090/graphData/outgoingAdditional",
      outgoingAdditonalLimited: "http://localhost:9090/graphData/outgoingAdditionalLimited",
      incoming: "http://localhost:9090/graphData/incoming",
      outgoingRandom : "http://localhost:9090/graphData/outgoingRandom",
      savedGraphData: "http://localhost:9090/graphData/savedGraphs",
      virtualGraphs: "http://localhost:9090/graphData/virtualGraphs",
      namedGraphs: "http://localhost:9090/graphData/namedGraphs",
      dbpaths: "http://localhost:9090/graphData/dbpaths",
      new: "http://localhost:9090/graphDataNew",
      classtable: "http://localhost:9090/classtable",
      classtableLabels: "http://localhost:9090/classtable/labels",
      classTableVirtualGraphs: "http://localhost:9090/classtable/virtualAttributes",
      classTableIncoming:"http://localhost:9090/classtable/incoming",
    },
    autocomplete: {
      outgoing: "http://localhost:9090/autocomplete/outgoing",
      outgoingAdditional: "http://localhost:9090/autocomplete/outgoingAdditional",
      incoming: "http://localhost:9090/autocomplete/incoming",
      incomingRandom: "http://localhost:9090/autocomplete/incoming/random",
    },
    paths: {
      links: "http://localhost:9090/paths/links",
      fullPath: "http://localhost:9090/paths/fullPath",
    },
    count: "http://localhost:9090/count/incoming",
    outgoingAdditonalCount: "http://localhost:9090/count/outgoing"
  },
  adalConfig: {
    authority: "xxx",
    clientId: 'xxx',
    redirectUri: 'http://localhost:4209/',
    protectedResourceMap: {
    },
    postLogoutRedirectUri: 'http://localhost:4209/'
  }
};
