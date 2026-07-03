export interface DocsRagSource {
  file: string;
  section: string;
  tags: string[];
  score: number;
}

export interface DocsRagAnswer {
  answer: string;
  sources: DocsRagSource[];
  confidence: number;
  not_in_docs: boolean;
}
