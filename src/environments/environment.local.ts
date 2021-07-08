export const environment = {
    production: true,
    allowAnonymous: true,
    apis : {
      graphData: {
        outgoing: "http://localhost:8080/graphData/outgoing",
        outgoingAdditonal: "http://localhost:8080/graphData/outgoingAdditional",
        outgoingAdditonalLimited: "http://localhost:8080/graphData/outgoingAdditionalLimited",
        incoming: "http://localhost:8080/graphData/incoming",
        outgoingRandom : "http://localhost:8080/graphData/outgoingRandom",
        savedGraphData: "http://localhost:8080/graphData/savedGraphs",
        virtualGraphs: "http://localhost:8080/graphData/virtualGraphs",
        namedGraphs: "http://localhost:8080/graphData/namedGraphs",
        dbpaths: "http://localhost:8080/graphData/dbpaths",
        new: "http://localhost:8080/graphDataNew",
        classtable: "http://localhost:8080/classtable",
        classtableLabels: "http://localhost:8080/classtable/labels",
        classTableVirtualGraphs: "http://localhost:8080/classtable/virtualAttributes"
      },
      autocomplete: {
        outgoing: "http://localhost:8080/autocomplete/outgoing",
        outgoingAdditional: "http://localhost:8080/autocomplete/outgoingAdditional",
        incoming: "http://localhost:8080/autocomplete/incoming",
        incomingRandom: "http://localhost:8080/autocomplete/incoming/random",
      },
      paths: {
        links: "http://localhost:8080/paths/links",
        fullPath: "http://localhost:8080/paths/fullPath",
      },
      count: "http://localhost:8080/count/incoming",
      outgoingAdditonalCount: "http://localhost:8080/count/outgoing"
    },
    adalConfig: {
      authority: "xxx",
      clientId: 'xxx',
      redirectUri: 'http://localhost:4400/',
      protectedResourceMap: {
      },
      postLogoutRedirectUri: 'http://localhost:4400/'
    }
  };
  
