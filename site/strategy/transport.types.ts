/**
 * CIC-VSC-RPC Transport Types
 * WebSocket framing, JSON-RPC 2.0 schemas, connection handshakes, and keep-alive.
 */

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest<T = any> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcNotification<T = any> {
  jsonrpc: "2.0";
  method: string;
  params?: T;
}

// ----------------------------------------------------
// Handshake & Connection Framing
// ----------------------------------------------------

export interface ClientHandshakeParams {
  clientId: string; // "vsc_extension_host"
  version: string;  // Extension version e.g. "1.0.0"
  workspacePath: string; // Absolute path to active workspace root
  authCookie?: string; // Local loopback validation token
}

export interface ServerHandshakeResult {
  status: "authenticated" | "rejected";
  daemonVersion: string;
  pid: number;
  capabilities: {
    hotSwap: boolean;
    evidenceVault: boolean;
    supportedAgents: string[]; // Agent IDs registered on startup
  };
}

// Heartbeat payload (sent every 30s to keep WebSocket from idling/dropping)
export interface PingPayload {
  timestamp: number;
  clientMemoryUsageBytes?: number;
}

export interface PongPayload {
  timestamp: number;
  serverMemoryUsageBytes?: number;
}

// ----------------------------------------------------
// Session Management Payloads
// ----------------------------------------------------

export interface SessionCreateParams {
  agentId: string; // ID of the target agent, e.g. "cic.agents.retrieval.harvester"
  workspaceRoot: string;
  env?: Record<string, string>;
}

export interface SessionCreateResult {
  sessionId: string;
  status: "idle" | "running" | "error";
  initialCheckpoint?: string; // Hash of base environment state
}

export interface SessionSubmitParams {
  sessionId: string;
  prompt: string;
  context?: {
    activeFile?: string;
    cursorLine?: number;
    selectionText?: string;
  };
}

export interface SessionSubmitResult {
  invocationId: string;
  initialPhase: "validate";
}

// ----------------------------------------------------
// Notification & Progress Streaming Payloads
// ----------------------------------------------------

export interface PhaseTransitionNotification {
  sessionId: string;
  invocationId: string;
  previousPhase: "validate" | "plan" | "execute" | "review" | "emit";
  currentPhase: "validate" | "plan" | "execute" | "review" | "emit";
  timestamp: string;
}

export interface LogStreamNotification {
  sessionId: string;
  invocationId: string;
  stream: "stdout" | "stderr" | "audit_trail";
  chunk: string; // Markdown text or status log segment
}

export interface GateApprovalNotification {
  sessionId: string;
  invocationId: string;
  gateId: string;
  message: string;
  diff?: FileDiff;
}

export interface FileDiff {
  file: string;
  changes: Array<{
    type: "add" | "modify" | "delete";
    line: number;
    old?: string;
    new?: string;
  }>;
}

export interface GateResolveParams {
  invocationId: string;
  gateId: string;
  approved: boolean;
}
