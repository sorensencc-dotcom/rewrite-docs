/**
 * HTTP Client for TorqueQuery Service
 * Proxies calls to torquequery microservice
 */

export interface QueryEvent {
  id: string;
  type: string;
  agentId?: string;
  correlationId?: string;
  timestamp: number;
  payload: unknown;
}

export interface QuerySignal {
  id: string;
  type: string;
  timestamp: number;
  payload: unknown;
}

export class TorqueQueryServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async byType(type: string): Promise<QueryEvent[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/memory/by-type/${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.events || [];
  }

  async byAgent(agentId: string): Promise<QueryEvent[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/memory/by-agent/${encodeURIComponent(agentId)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.events || [];
  }

  async countByAgent(agentId: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}/torquequery/memory/by-agent/${encodeURIComponent(agentId)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.count || 0;
  }

  async byCorrelation(correlationId: string): Promise<QueryEvent[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/memory/by-correlation/${encodeURIComponent(correlationId)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.events || [];
  }

  async bySignal(signalType: string): Promise<QuerySignal[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/memory/by-signal/${encodeURIComponent(signalType)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.signals || [];
  }

  async agentTimeline(agentId: string): Promise<QueryEvent[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/agent/${encodeURIComponent(agentId)}/timeline`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.timeline || [];
  }

  async governanceHistory(proposalId: string): Promise<QueryEvent[]> {
    const res = await fetch(`${this.baseUrl}/torquequery/governance/history/${encodeURIComponent(proposalId)}`);
    if (!res.ok) throw new Error(`TorqueQuery service error: ${res.status}`);
    const json = (await res.json()) as any;
    return json.history || [];
  }
}
