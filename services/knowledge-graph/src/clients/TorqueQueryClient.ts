// Node 18+ has built-in fetch

export interface TorqueEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  actor: string;
  payload: Record<string, unknown>;
  meta: {
    trace_id: string;
    span_id: string;
    schema_version: number;
  };
}

export interface EventCursor {
  lastEventId: string;
  lastEventTimestamp: number;
}

export class TorqueQueryClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = "http://torquequery:3110", timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return fetch(url, { ...options, signal: controller.signal }).finally(() =>
      clearTimeout(timeoutId)
    );
  }

  /**
   * Fetch events by time range from TorqueQuery
   */
  async getEventsByTimeRange(
    startTimestamp: number,
    endTimestamp: number,
    eventType?: string
  ): Promise<TorqueEvent[]> {
    const params = new URLSearchParams({
      start: startTimestamp.toString(),
      end: endTimestamp.toString(),
    });

    if (eventType) {
      params.append("type", eventType);
    }

    const url = `${this.baseUrl}/api/torque/events?${params.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(
          `TorqueQuery returned ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as { events: TorqueEvent[] };
      return data.events || [];
    } catch (err: any) {
      throw new Error(`Failed to fetch from TorqueQuery: ${err.message}`);
    }
  }

  /**
   * Fetch events after a specific event ID (cursor-based pagination)
   */
  async getEventsAfter(
    eventId: string,
    limit: number = 100
  ): Promise<TorqueEvent[]> {
    const params = new URLSearchParams({
      after: eventId,
      limit: limit.toString(),
    });

    const url = `${this.baseUrl}/api/torque/events?${params.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(
          `TorqueQuery returned ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as { events: TorqueEvent[] };
      return data.events || [];
    } catch (err: any) {
      throw new Error(`Failed to fetch from TorqueQuery: ${err.message}`);
    }
  }

  /**
   * Stream events from TorqueQuery (long-polling or WebSocket compatible)
   */
  async *streamEvents(
    cursor?: EventCursor,
    pollInterval: number = 1000
  ): AsyncGenerator<TorqueEvent, void, unknown> {
    let lastEventId = cursor?.lastEventId || "";

    while (true) {
      try {
        const events = await this.getEventsAfter(lastEventId, 100);

        if (events.length === 0) {
          // No new events, wait before polling again
          await new Promise((r) => setTimeout(r, pollInterval));
          continue;
        }

        // Yield events
        for (const event of events) {
          yield event;
          lastEventId = event.id;
        }
      } catch (err) {
        console.error("Error streaming events:", err);
        // Wait before retrying
        await new Promise((r) => setTimeout(r, pollInterval * 2));
      }
    }
  }

  /**
   * Health check for TorqueQuery service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get TorqueQuery service info
   */
  async getServiceInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/info`);

      if (!response.ok) {
        throw new Error(
          `TorqueQuery returned ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (err: any) {
      throw new Error(`Failed to get service info: ${err.message}`);
    }
  }
}
