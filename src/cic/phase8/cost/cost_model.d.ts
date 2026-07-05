/**
 * Phase 8: Cost Model
 * Maintains rolling windows of cost data (5m, 1h, 24h).
 */
import { CostEvent } from '../types/cost_event.js';
export interface CostWindow {
    windowName: string;
    windowMs: number;
    totalCostUsd: number;
    eventCount: number;
    startTime: string;
    endTime: string;
}
export declare class CostModel {
    private maxEventsInMemory;
    private events;
    private readonly windows;
    constructor(maxEventsInMemory?: number);
    recordEvent(event: CostEvent): void;
    private getWindowEvents;
    getDailySpendUsd(): number;
    getHourlySpendUsd(): number;
    getFiveMinuteSpendUsd(): number;
    getSpendByAgent(windowMs?: number): Record<string, number>;
    getSpendByModel(windowMs?: number): Record<string, number>;
    getSpendWindow(name: '5m' | '1h' | '24h'): CostWindow;
    clear(): void;
}
//# sourceMappingURL=cost_model.d.ts.map