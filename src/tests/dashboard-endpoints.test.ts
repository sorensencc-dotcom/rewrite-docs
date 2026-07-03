// src/tests/dashboard-endpoints.test.ts
// semver: 0.1.0
// date: 2026-06-29

import app from "../server/adapterGatewayAPI.js";
import http from "http";

describe("Dashboard Endpoints", () => {
  let server: http.Server;
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
    const data = (await res.json()) as any;
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
