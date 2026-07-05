class MockProvider {
    async callChat(spec, payload) {
        const text = `[MOCK:${payload.model}] ${payload.messages.map(m => m.content).join(" ")}`;
        const raw = { content: [{ type: "text", text }], model: spec.name };
        if (payload.requires?.toolCalls) {
            raw.tool_calls = [];
        }
        return {
            raw,
            text,
            model: spec.name,
            tokensUsed: { input: 1, output: 1 }
        };
    }
}
export const mockProvider = new MockProvider();
//# sourceMappingURL=mock.js.map