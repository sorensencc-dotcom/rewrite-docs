export interface AuditEvent {
    eventId: string;
    eventType: "gate_created" | "gate_approved" | "gate_rejected" | "promotion_requested" | "promotion_executed" | "rollback_initiated" | "rollback_completed" | "drift_decay" | "drift_score_updated" | "sla_violation" | "governance_lockdown" | "promotion_frozen";
    actor: string;
    taskId: string;
    targetStage: string;
    status: "success" | "failure";
    reason: string;
    policyChecksPassed: string[];
    policyChecksFailed: string[];
    hash: string;
    timestamp: number;
}
export interface AuditLog {
    events: AuditEvent[];
    totalEvents: number;
    successCount: number;
    failureCount: number;
    lastEventHash: string;
}
export declare function checkMinimumApprovals(approvalCount: number): {
    passed: boolean;
    message: string;
};
export declare function checkCooldownPeriod(promotionTime: number, currentTime: number): {
    passed: boolean;
    message: string;
};
export declare function checkTestResults(testsPassed: number, testsTotal: number): {
    passed: boolean;
    message: string;
};
export declare function createAuditEvent(eventType: AuditEvent["eventType"], actor: string, taskId: string, targetStage: string, status: "success" | "failure", reason: string, policyChecksPassed: string[], policyChecksFailed: string[]): AuditEvent;
export declare function loadAuditLog(logPath?: string): AuditLog;
export declare function appendAuditEvent(event: AuditEvent, logPath?: string): AuditLog;
export declare function generateAuditReport(taskId: string, logPath?: string): {
    taskId: string;
    events: AuditEvent[];
    summary: string;
};
export declare function verifyAuditChain(logPath?: string): {
    valid: boolean;
    breakAt?: number;
};
//# sourceMappingURL=audit-policy.d.ts.map