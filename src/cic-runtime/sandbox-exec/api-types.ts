export interface NetworkTraceEvent {
  timestamp: string;
  dest_ip: string;
  dest_port: number;
  protocol: string;
  bytes_sent: number;
  bytes_received: number;
}

export interface FileAccessEvent {
  file: string;
  result: number;
  error_code: string | null;
}

export interface TracesResponse {
  networkTrace: NetworkTraceEvent[];
  fileAccess: FileAccessEvent[];
}

export interface LatencyResponse {
  latencyMs: number;
  sloViolated: boolean;
}

export interface ReproducibilityResponse {
  vmConfigHash: string;
  envHash: string;
  fsHash: string;
  snapshotHash: string;
}

export interface StabilityResponse {
  avgScore: number;
  level: 'low' | 'medium' | 'high';
}
