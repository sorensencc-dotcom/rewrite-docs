// src/config.ts
export const config = {
    bookstack: {
        baseUrl: process.env.BOOKSTACK_BASE_URL ?? "http://localhost:4001",
        mock: process.env.BOOKSTACK_MOCK !== "false", // default to true unless explicitly disabled
        oidc: {
            clientId: process.env.BOOKSTACK_OIDC_CLIENT_ID ?? "cic-bookstack",
            clientSecret: process.env.BOOKSTACK_OIDC_CLIENT_SECRET ?? "dev_secret",
            tokenUrl: process.env.OIDC_TOKEN_URL ?? "https://auth.internal/oidc/token",
        },
    },
};
//# sourceMappingURL=config.js.map