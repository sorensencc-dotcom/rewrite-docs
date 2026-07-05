// src/utils/__tests__/idResolver.test.ts
import { describe, test, expect } from "@jest/globals";
import { DeterministicIdResolver } from "../idResolver.js";
describe("DeterministicIdResolver", () => {
    test("shelfId is deterministic", () => {
        expect(DeterministicIdResolver.shelfId("AdapterLayer"))
            .toBe("CIC-AdapterLayer");
    });
    test("bookId uses phase number", () => {
        expect(DeterministicIdResolver.bookId(27)).toBe("Phase-27");
    });
    test("chapterId uses component name", () => {
        expect(DeterministicIdResolver.chapterId("WarmPoolManager"))
            .toBe("Component-WarmPoolManager");
    });
    test("pageId uses artifact type", () => {
        expect(DeterministicIdResolver.pageId("sop"))
            .toBe("Artifact-sop");
    });
    test("resolve returns full ID set", () => {
        const ids = DeterministicIdResolver.resolve({
            domain: "AdapterLayer",
            phase: 27,
            component: "TorqueQuery",
            artifactType: "contract",
        });
        expect(ids).toEqual({
            shelf_id: "CIC-AdapterLayer",
            book_id: "Phase-27",
            chapter_id: "Component-TorqueQuery",
            page_id: "Artifact-contract",
        });
    });
});
//# sourceMappingURL=idResolver.test.js.map