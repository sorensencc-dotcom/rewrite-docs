export const mockKnowledgeGraphSlice = {
    docs: [
        { title: "Unified Graph Integration Guide", path: "docs/cic/graph-integration.md", content: "Integrate TrueCode, GitNexus, and Graphify under a unified GraphContextAPI." }
    ],
    adr: [
        { id: "ADR-012", title: "Deterministic Context Routing", status: "Accepted", deciders: ["engineering-leads"] }
    ],
    constraints: [
        { name: "MaxTokenBudget", value: "8000" }
    ],
    diagrams: [
        { name: "subsystem-architecture", path: "docs/cic/diagrams/subsystem.png" }
    ],
    slas: [
        { name: "latency-p95", targetMs: 2500 }
    ],
    overviewDocs: [
        { title: "Service Overview", path: "docs/cic/overview.md", content: "Brief summary of service components." }
    ],
    designIntent: [
        { id: "ADR-012", title: "Deterministic Context Routing", status: "Accepted", deciders: ["engineering-leads"] }
    ],
    documentedArchitecture: [
        { title: "Core Subsystem", path: "docs/cic/architecture.md", content: "Deterministic routing and merging of context slices." }
    ]
};
//# sourceMappingURL=GraphifyMock.js.map