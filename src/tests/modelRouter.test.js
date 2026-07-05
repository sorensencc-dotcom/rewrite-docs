import { callModel } from "../core/modelRouter.js";
describe("modelRouter", () => {
    it("throws for unknown model", async () => {
        await expect(callModel({ model: "does-not-exist", messages: [] })).rejects.toThrow();
    });
});
//# sourceMappingURL=modelRouter.test.js.map