import { Database } from "../db";
interface SchedulerConfig {
    dailyRunTime?: string;
    weeklyRunDay?: number;
    cleanupDaysOld?: number;
}
export declare class Scheduler {
    private db;
    private dailyRunTime;
    private weeklyRunDay;
    private cleanupDaysOld;
    private changeDetection;
    private contributor;
    private tracker;
    private notifier;
    private timers;
    constructor(db: Database, config?: SchedulerConfig);
    start(): void;
    stop(): void;
    private scheduleDailyRun;
    private scheduleWeeklyReport;
    private schedulePRStatusPolling;
    private scheduleCleanup;
    private runDailyChangeDetection;
    private runWeeklyReport;
    private runPRStatusPolling;
    private runCleanup;
}
export {};
//# sourceMappingURL=scheduler.d.ts.map