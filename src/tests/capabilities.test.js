import { supportsToolCalls, supportsVision } from "../core/capabilities.js";
describe("capabilities", () => {
    it("detects tool support correctly", () => {
        expect(supportsToolCalls("fugu")).toBe(true);
        expect(supportsToolCalls("glm-flash")).toBe(false);
    });
    it("detects vision support correctly", () => {
        expect(supportsVision("fugu")).toBe(false);
        expect(supportsVision("fugu-ultra")).toBe(false); // as per JSON
        expect(supportsVision("claude-3.7")).toBe(true);
    });
});
//# sourceMappingURL=capabilities.test.js.map