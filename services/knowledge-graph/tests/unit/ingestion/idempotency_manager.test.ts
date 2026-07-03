import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { GraphStore } from "../../../src/core/graph_store/GraphStore";
import { IdempotencyManager } from "../../../src/ingestion/IdempotencyManager";

describe("IdempotencyManager & Cursor (Tests 27–34)", () => {
  let store: GraphStore;
  let idempotency: IdempotencyManager;

  beforeEach(() => {
    store = new GraphStore(":memory:");
    idempotency = new IdempotencyManager(store);
  });

  afterEach(() => {
    store.close();
    idempotency.close();
  });

  describe("Event deduplication", () => {
    it("Test 27: should detect duplicate event IDs", async () => {
      const eventId = "evt-27-dup";
      const source = "torque";

      // First event
      const isDup1 = await idempotency.isDuplicate(eventId, source);
      expect(isDup1).toBe(false);

      // Mark as processed
      await idempotency.updateCursor(source, eventId, Date.now());

      // Second check
      const isDup2 = await idempotency.isDuplicate(eventId, source);
      expect(isDup2).toBe(true);
    });

    it("Test 28: should support source isolation (same ID, different sources)", async () => {
      const eventId = "evt-28-multi-source";

      // Register in source 'torque'
      await idempotency.updateCursor("torque", eventId, Date.now());
      const isDupTorque = await idempotency.isDuplicate(eventId, "torque");
      expect(isDupTorque).toBe(true);

      // Check in source 'vault' (different source)
      const isDupVault = await idempotency.isDuplicate(eventId, "vault");
      expect(isDupVault).toBe(false);
    });

    it("Test 29: should maintain cursor across multiple events", async () => {
      const source = "torque";
      const now = Date.now();

      for (let i = 1; i <= 5; i++) {
        const eventId = `evt-29-${i}`;
        await idempotency.updateCursor(source, eventId, now + i * 1000);
      }

      const cursor = await idempotency.getCursor(source);
      expect(cursor).toBeDefined();
      expect(cursor?.lastEventId).toBe("evt-29-5");
      expect(cursor?.lastEventTimestamp).toBe(now + 5 * 1000);
    });

    it("Test 30: should report event lag", async () => {
      const source = "torque";
      const pastTimestamp = Date.now() - 60 * 1000; // 1 minute ago

      await idempotency.updateCursor(source, "evt-30", pastTimestamp);

      const status = await idempotency.getCursorStatus(source);
      expect(status).toBeDefined();
      expect(status?.lag).toBeGreaterThan(50000); // At least 50 seconds ago
    });

    it("Test 31: should return null cursor for unknown source", async () => {
      const cursor = await idempotency.getCursor("nonexistent-source");
      expect(cursor).toBeNull();
    });

    it("Test 32: should allow clearing old duplicates", async () => {
      const source = "torque";
      const cutoffTime = Date.now();

      // Add events before cutoff
      await idempotency.updateCursor(source, "evt-32-old", cutoffTime - 10000);

      // Add events after cutoff
      await idempotency.updateCursor(source, "evt-32-new", cutoffTime + 10000);

      // Clear old events
      const cleared = await idempotency.clearDuplicates(source, cutoffTime);
      expect(cleared).toBe(1);

      // Old event should not be duplicate anymore
      const isOldDup = await idempotency.isDuplicate("evt-32-old", source);
      expect(isOldDup).toBe(false);

      // New event should still be duplicate
      const isNewDup = await idempotency.isDuplicate("evt-32-new", source);
      expect(isNewDup).toBe(true);
    });

    it("Test 33: should handle concurrent cursor updates", async () => {
      const source = "torque";
      const now = Date.now();

      // Simulate concurrent updates
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(
          idempotency.updateCursor(source, `evt-33-${i}`, now + i)
        );
      }

      await Promise.all(promises);

      const cursor = await idempotency.getCursor(source);
      expect(cursor).toBeDefined();
      // Last event should be the one with highest timestamp
      expect(cursor?.lastEventTimestamp).toBe(now + 10);
    });

    it("Test 34: should preserve cursor metadata", async () => {
      const source = "torque";
      const eventId = "evt-34-meta";
      const timestamp = Date.now();

      await idempotency.updateCursor(source, eventId, timestamp);

      const cursor = await idempotency.getCursor(source);
      expect(cursor?.metaJson).toBeDefined();
      expect(cursor?.lastEventId).toBe(eventId);
      expect(cursor?.lastEventTimestamp).toBe(timestamp);
    });
  });
});
