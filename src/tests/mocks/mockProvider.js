export class MockProvider {
    mode = "ok";
    delayMs = 0;
    simulate(config) {
        this.mode = config.type;
        this.delayMs = config.delayMs ?? 0;
    }
    async callChat(spec, payload) {
        if (this.delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }
        switch (this.mode) {
            case "500":
                throw new Error("500: internal server error");
            case "timeout":
                return new Promise((_, reject) => setTimeout(() => reject(new Error("Simulated timeout")), 25000));
            case "malformed":
                throw new SyntaxError("Unexpected token");
            case "empty":
                return {
                    raw: { content: [{ type: "text", text: "" }] },
                    text: "",
                    model: spec.name
                };
            case "drift":
                return {
                    raw: {
                        content: [{ type: "text", text: "slightly different wording than expected" }],
                        model: spec.name
                    },
                    text: "slightly different wording than expected",
                    model: spec.name
                };
            case "capability_mismatch":
                return {
                    raw: {
                        content: [{ type: "text", text: "no vision" }],
                        model: "text-only-model"
                    },
                    text: "no vision",
                    model: "text-only-model"
                };
            default:
                return {
                    raw: {
                        content: [{ type: "text", text: "OK response" }],
                        model: spec.name,
                        usage: { input_tokens: 10, output_tokens: 20 }
                    },
                    text: "OK response",
                    tokensUsed: { input: 10, output: 20 },
                    model: spec.name
                };
        }
    }
    reset() {
        this.mode = "ok";
        this.delayMs = 0;
    }
}
//# sourceMappingURL=mockProvider.js.map