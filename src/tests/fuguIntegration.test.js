import { callModel } from "../core/modelRouter.js";
describe("fugu integration", () => {
    it("can call fugu chat", async () => {
        if (!process.env.SAKANA_API_KEY) {
            // Skipping fugu test: SAKANA_API_KEY not set
            return;
        }
        const res = await callModel({
            model: "fugu",
            messages: [
                { role: "user", content: "Say 'Fugu is live in CIC'." }
            ]
        });
        expect(res.text).toContain("Fugu");
    });
});
//# sourceMappingURL=fuguIntegration.test.js.map