/**
 * @jest-environment node
 */
// src/adapters/__tests__/BookStackAdapter.test.ts
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { BookStackAdapter } from "../BookStackAdapter.js";
import { createMockBookStackServer } from "../../integration/mocks/mockBookStackServer.js";
let server;
let adapter;
beforeAll((done) => {
    const app = createMockBookStackServer();
    server = app.listen(4001, () => {
        // Adapter with mock disabled to actually hit the server via fetch
        adapter = new BookStackAdapter({
            mock: false,
            baseUrl: "http://127.0.0.1:4001",
            tokenUrl: "http://127.0.0.1:4001/oidc/token",
        });
        done();
    });
});
afterAll((done) => {
    server.close(done);
});
describe("BookStackAdapter", () => {
    test("upsertShelf succeeds", async () => {
        const res = await adapter.run("upsertShelf", {
            shelf_id: "CIC-AdapterLayer",
            name: "Adapter Layer",
        });
        expect(res.ok).toBe(true);
        expect(res.data.status).toBe("updated");
    });
    test("upsertPage validates content", async () => {
        const res = await adapter.run("upsertPage", {
            chapter_id: "Component-Test",
            page_id: "Artifact-sop",
            title: "Test",
            content: "", // empty content, should trigger guard
        });
        expect(res.ok).toBe(false);
        expect(res.error?.code).toBe("GUARD_VIOLATION");
    });
    test("getPage returns stored page", async () => {
        await adapter.run("upsertPage", {
            chapter_id: "Component-Test",
            page_id: "Artifact-contract",
            title: "Contract",
            content: "Hello world",
        });
        const res = await adapter.run("getPage", { page_id: "Artifact-contract" });
        expect(res.ok).toBe(true);
        expect(res.data.title).toBe("Contract");
    });
    test("search returns matching pages", async () => {
        const res = await adapter.run("search", { q: "hello" });
        expect(res.ok).toBe(true);
        expect(res.data.results.length).toBeGreaterThan(0);
    });
    test("health returns ok", async () => {
        const res = await adapter.run("health", {});
        expect(res.ok).toBe(true);
        expect(res.data.status).toBe("ok");
    });
});
//# sourceMappingURL=BookStackAdapter.test.js.map