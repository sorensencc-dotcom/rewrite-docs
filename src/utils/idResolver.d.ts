export type Domain = "Core" | "AdapterLayer" | "IngestionLayer" | "PlanningEngine" | "CorpusIntrospection";
export interface IdInputs {
    domain: Domain;
    phase: number;
    component: string;
    artifactType: string;
}
export declare class DeterministicIdResolver {
    static shelfId(domain: Domain): string;
    static bookId(phase: number): string;
    static chapterId(component: string): string;
    static pageId(artifactType: string): string;
    static resolve(inputs: IdInputs): {
        shelf_id: string;
        book_id: string;
        chapter_id: string;
        page_id: string;
    };
}
//# sourceMappingURL=idResolver.d.ts.map