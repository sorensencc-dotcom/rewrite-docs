// src/tests/dashboard-endpoints.test.ts
// semver: 0.1.0
// date: 2026-06-29
import app from "../server/adapterGatewayAPI.js";
describe("Dashboard Endpoints", () => {
    let server;
    const testPort = 3125;
    beforeAll(done => {
        server = app.listen(testPort, () => {
            done();
        });
    });
    afterAll(done => {
        server.close(() => {
            done();
        });
    });
    test("GET /metrics should return drift state and recent logs", async () => {
        const res = await fetch(`http://localhost:${testPort}/metrics`);
        expect(res.status).toBe(200);
        const data = (await res.json());
        expect(data).toHaveProperty("drift");
        expect(data).toHaveProperty("recent");
        expect(Array.isArray(data.recent)).toBe(true);
    });
    test("GET /dashboard should return html page", async () => {
        const res = await fetch(`http://localhost:${testPort}/dashboard`);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain("<!DOCTYPE html>");
        expect(text).toContain("CIC DRIFT CONTROL CENTER");
    });
});
//# sourceMappingURL=dashboard-endpoints.test.js.map