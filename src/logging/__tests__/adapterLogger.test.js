// src/logging/__tests__/adapterLogger.test.ts
import { describe, test, expect, beforeEach } from "@jest/globals";
import { adapterLogger } from "../adapterLogger.js";
describe("adapterLogger", () => {
    let logs;
    beforeEach(() => {
        logs = [];
        adapterLogger._setSink((entry) => logs.push(entry));
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
//# sourceMappingURL=adapterLogger.test.js.map