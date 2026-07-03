import { Request, Response } from "express";
import { IdempotencyManager } from "../../../ingestion/IdempotencyManager";

export function eventLagRoute(idempotency: IdempotencyManager) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      // Check lag for all known sources
      const sources = ["torque", "vault"];
      const lags: Record<string, any> = {};

      for (const source of sources) {
        const status = await idempotency.getCursorStatus(source);
        if (status) {
          lags[source] = {
            lagMs: status.lag,
            lastEventId: status.lastEventId,
            lastEventTimestamp: new Date(
              status.lastEventTimestamp
            ).toISOString(),
          };
        }
      }

      res.json({
        status: "ok",
        timestamp: Date.now(),
        lags,
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        error: err.message,
        timestamp: Date.now(),
      });
    }
  };
}
