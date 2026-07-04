import { CodeGraphSlice } from '../../GraphContext.js';

export const mockCodeGraphSlice: CodeGraphSlice = {
  symbols: [
    { id: "sym-1", name: "RefactorAgent", type: "class", path: "src/agents/RefactorAgent.ts" },
    { id: "sym-2", name: "DriftAgent", type: "class", path: "src/agents/DriftAgent.ts" },
    { id: "sym-3", name: "DiscoveryAgent", type: "class", path: "src/agents/DiscoveryAgent.ts" }
  ],
  dependencies: [
    { from: "src/agents/RefactorAgent.ts", to: "src/cic/graph/GraphContext.ts", kind: "import" }
  ],
  callGraph: [
    { caller: "RefactorAgent.run", callee: "getRefactorContext", file: "src/agents/RefactorAgent.ts" }
  ],
  entrypoints: [
    { name: "main", file: "src/index.ts" }
  ],
  boundaries: [
    { name: "public-api", files: ["src/cic/graph/GraphContextBuilder.ts"] }
  ],
  structure: {
    modules: ["graph", "agents", "harvester", "discovery"],
    dependencyMatrix: [[0, 1], [0, 0]]
  }
};
