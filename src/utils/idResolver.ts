// src/utils/idResolver.ts
export type Domain =
  | "Core"
  | "AdapterLayer"
  | "IngestionLayer"
  | "PlanningEngine"
  | "CorpusIntrospection";

export interface IdInputs {
  domain: Domain;
  phase: number;
  component: string;
  artifactType: string;
}

export class DeterministicIdResolver {
  static shelfId(domain: Domain): string {
    return `CIC-${domain}`;
  }

  static bookId(phase: number): string {
    if (!Number.isInteger(phase) || phase < 0) {
      throw new Error(`Invalid phase: ${phase}`);
    }
    return `Phase-${phase}`;
  }

  static chapterId(component: string): string {
    if (!component || component.trim().length === 0) {
      throw new Error("Component name required");
    }
    return `Component-${component}`;
  }

  static pageId(artifactType: string): string {
    if (!artifactType || artifactType.trim().length === 0) {
      throw new Error("Artifact type required");
    }
    return `Artifact-${artifactType}`;
  }

  static resolve(inputs: IdInputs) {
    return {
      shelf_id: this.shelfId(inputs.domain),
      book_id: this.bookId(inputs.phase),
      chapter_id: this.chapterId(inputs.component),
      page_id: this.pageId(inputs.artifactType),
    };
  }
}
