// src/maal/router/llm-router.ts
/**
 * Stub: Select model based on MAAL request.
 * In Phase 2, this integrates with existing ModelRouter.
 */
export function selectModel(req) {
    // Phase Sandbox-1 stub: default to claude-opus for high-trust, otherwise claude-sonnet
    if (req.trustLevel === "admin" || req.trustLevel === "internal") {
        return { id: "claude-opus", reasonCodes: [`model:claude-opus`, `trust:${req.trustLevel}`] };
    }
    return { id: "claude-sonnet", reasonCodes: [`model:claude-sonnet`, `trust:${req.trustLevel}`] };
}
//# sourceMappingURL=llm-router.js.map