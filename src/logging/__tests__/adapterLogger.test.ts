// src/logging/__tests__/adapterLogger.test.ts
import { describe, test, expect, beforeEach } from "@jest/globals";
import { adapterLogger } from "../adapterLogger.js";

describe("adapterLogger", () => {
  let logs: any[];

  beforeEach(() => {
    logs = [];
    adapterLogger._setSink((entry: any) => logs.push(entry));
  });

  afterEach(() => {
    adapterLogger._setSink(null);
  });

  test("logs info entries with metadata", () => {
    adapterLogger.info({ adapter: "bookstack", operation: "upsertPage", msg: "ok" });

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe("info");
    expect(logs[0].adapter).toBe("bookstack");
    expect(logs[0].operation).toBe("upsertPage");
  });

  test("logs error entries with stack traces", () => {
    const err = new Error("boom");
    adapterLogger.error({ adapter: "bookstack", operation: "search", error: err });

    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe("error");
    expect(logs[0].error.message).toBe("boom");
    expect(logs[0].error.stack).toBeDefined();
  });

  test("timestamps are included", () => {
    adapterLogger.info({ adapter: "bookstack", operation: "health" });
    expect(logs[0].timestamp).toBeDefined();
  });
});
