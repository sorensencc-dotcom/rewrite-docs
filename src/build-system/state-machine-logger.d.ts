import { OrchestratorState } from './self-healing-events';
export interface StateTransition {
    buildId: string;
    nodeId: string;
    from: OrchestratorState;
    to: OrchestratorState;
    timestamp: string;
}
export interface StateMachineLogger {
    log(transition: StateTransition): void;
}
export declare class ConsoleStateMachineLogger implements StateMachineLogger {
    log(t: StateTransition): void;
}
//# sourceMappingURL=state-machine-logger.d.ts.map