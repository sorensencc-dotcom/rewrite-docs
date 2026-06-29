// src/utils/mockOidc.ts
export function generateMockOidcToken() {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: "mock-issuer",
    sub: "cic-adapter",
    aud: "bookstack",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).toString("base64url");

  // unsigned JWT for mock mode
  return `${header}.${payload}.`;
}
