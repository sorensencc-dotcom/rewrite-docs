import { Request, Response } from "express";
import { IdempotencyManager } from "../../../ingestion/IdempotencyManager";

export function cursorStatusRoute(idempotency: IdempotencyManager) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { source } = req.query as { source?: string };

      if (!source) {
        res.status(400).json({
          status: "error",
          error: "source query parameter required",
        });
        return;
      }

      const status = await idempotency.getCursorStatus(source);

      if (!status) {
        res.json({
          status: "no_cursor",
          source,
          message: "No cursor found for this source",
          timestamp: Date.now(),
        });
        return;
      }

      const lagMs = status.lag;
      const lagMinutes = Math.floor(lagMs / 60000);
      const lagStatus =
        lagMs < 10000
          ? "current"
          : lagMs < 60000
            ? "minor_lag"
            : lagMs < 300000
              ? "moderate_lag"
              : "severe_lag";

      res.json({
        status: "ok",
        source,
        lastEventId: status.lastEventId,
        lastEventTimestamp: new Date(status.lastEventTimestamp).toISOString(),
        lagMs,
        lagMinutes,
        lagStatus,
        timestamp: Date.now(),
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
