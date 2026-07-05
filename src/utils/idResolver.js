export class DeterministicIdResolver {
    static shelfId(domain) {
        return `CIC-${domain}`;
    }
    static bookId(phase) {
        if (!Number.isInteger(phase) || phase < 0) {
            throw new Error(`Invalid phase: ${phase}`);
        }
        return `Phase-${phase}`;
    }
    static chapterId(component) {
        if (!component || component.trim().length === 0) {
            throw new Error("Component name required");
        }
        return `Component-${component}`;
    }
    static pageId(artifactType) {
        if (!artifactType || artifactType.trim().length === 0) {
            throw new Error("Artifact type required");
        }
        return `Artifact-${artifactType}`;
    }
    static resolve(inputs) {
        return {
            shelf_id: this.shelfId(inputs.domain),
            book_id: this.bookId(inputs.phase),
            chapter_id: this.chapterId(inputs.component),
            page_id: this.pageId(inputs.artifactType),
        };
    }
}
//# sourceMappingURL=idResolver.js.map