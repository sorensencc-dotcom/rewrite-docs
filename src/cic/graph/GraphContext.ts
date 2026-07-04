export interface GraphContext {
  code: CodeGraphSlice;
  history: RepoHistorySlice;
  knowledge: KnowledgeGraphSlice;
  meta: ContextMeta;
}

export interface SymbolNode {
  id: string;
  name: string;
  type: string;
  path: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: string;
}

export interface CallEdge {
  caller: string;
  callee: string;
  file?: string;
}

export interface EntrypointNode {
  name: string;
  file: string;
}

export interface BoundaryNode {
  name: string;
  files: string[];
}

export interface StructuralGraph {
  modules: string[];
  dependencyMatrix: number[][];
}

export interface CodeGraphSlice {
  symbols: SymbolNode[];
  dependencies: DependencyEdge[];
  callGraph: CallEdge[];
  entrypoints?: EntrypointNode[];
  boundaries?: BoundaryNode[];
  structure?: StructuralGraph;
}

export interface CommitNode {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface AuthorNode {
  name: string;
  email: string;
  commitsCount: number;
}

export interface CoChange {
  fileA: string;
  fileB: string;
  occurrences: number;
}

export interface BlastRadiusReport {
  affectedFiles: string[];
  impactScore: number;
  coChanges: CoChange[];
}

export interface ChangeEvent {
  eventId: string;
  timestamp: string;
  type: string;
  message: string;
}

export interface OwnerNode {
  file: string;
  owner: string;
  percentage: number;
}

export interface RepoHistorySlice {
  commits: CommitNode[];
  authors: AuthorNode[];
  blastRadius?: BlastRadiusReport;
  volatility?: number;
  changeTimeline?: ChangeEvent[];
  churn?: number;
  ownership?: OwnerNode[];
}

export interface DocNode {
  title: string;
  path: string;
  content: string;
}

export interface ADRNode {
  id: string;
  title: string;
  status: string;
  deciders: string[];
}

export interface ConstraintNode {
  name: string;
  value: string;
}

export interface DiagramNode {
  name: string;
  path: string;
}

export interface SLANode {
  name: string;
  targetMs: number;
}

export interface KnowledgeGraphSlice {
  docs: DocNode[];
  adr: ADRNode[];
  constraints?: ConstraintNode[];
  diagrams?: DiagramNode[];
  slas?: SLANode[];
  overviewDocs?: DocNode[];
  designIntent?: ADRNode[];
  documentedArchitecture?: DocNode[];
}

export interface ContextMeta {
  generatedAt: string; // ISO8601 string
  policy: string;
  repo?: string;
  service?: string;
}

export interface GraphContextAPI {
  getRefactorContext(req: { repo: string; files: string[] }): Promise<GraphContext>;
  getDriftContext(req: { service: string }): Promise<GraphContext>;
  getDiscoveryContext(req: { service: string }): Promise<GraphContext>;
}
