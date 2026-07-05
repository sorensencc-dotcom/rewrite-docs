/**
 * Fire-Drill Router (D-Phase)
 * Resilience testing endpoints for MAAL routing layer
 * POST /autonomy/firedrills/run → Execute all 6 fire-drills
 * GET /autonomy/firedrills/report → Last fire-drill report
 * GET /autonomy/firedrills/health → Current health status
 */
import { Router } from "express";
import { FireDrillManager } from "../FireDrillManager.js";
export declare function getFireDrillManager(): FireDrillManager;
export declare function createFireDrillRouter(): Router;
//# sourceMappingURL=firedrills.d.ts.map