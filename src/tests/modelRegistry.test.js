import { loadModelRegistry, getModelSpec } from "../core/modelRegistry.js";
describe("modelRegistry", () => {
    it("loads all model specs", () => {
        const reg = loadModelRegistry();
        expect(reg.size).toBeGreaterThan(0);
    });
    it("resolves fugu", () => {
        const spec = getModelSpec("fugu");
        expect(spec.provider).toBe("sakana");
        expect(spec.type).toBe("openai-compatible");
    });
});
//# sourceMappingURL=modelRegistry.test.js.map