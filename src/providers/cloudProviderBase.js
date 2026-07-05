export async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
export function validateAuthKey(key, envVar) {
    if (!key && process.env.NODE_ENV !== "test" && !process.env.MOCK_PROVIDERS) {
        throw new Error(`${envVar} required for production. Set in .env or use NODE_ENV=test or MOCK_PROVIDERS=1`);
    }
}
export function estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}
//# sourceMappingURL=cloudProviderBase.js.map