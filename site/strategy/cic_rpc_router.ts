import WebSocket, { WebSocketServer } from 'ws';
import { z } from 'zod';

interface RpcRequest {
  jsonrpc: '2.0';
  id?: string;
  method: string;
  params?: any;
}

interface RpcResponse {
  jsonrpc: '2.0';
  id?: string;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

// Zod Validation Schemas for Incoming RPC Parameters
const HelloParamsSchema = z.object({
  client: z.string(),
  version: z.string()
});

const SessionCreateParamsSchema = z.object({
  agentId: z.string(),
  workspaceRoot: z.string()
});

const SessionSubmitParamsSchema = z.object({
  sessionId: z.string(),
  prompt: z.string()
});

export class CicRpcServer {
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', ws => this.handleConnection(ws));
    console.log(`[CIC Daemon] WebSocket Server listening on port ${port}`);
  }

  private handleConnection(ws: WebSocket) {
    ws.on('message', data => this.handleMessage(ws, data.toString()));
  }

  private async handleMessage(ws: WebSocket, raw: string) {
    let msg: RpcRequest;
    try {
      msg = JSON.parse(raw) as RpcRequest;
    } catch (err: any) {
      this.sendError(ws, null, -32700, "Parse Error");
      return;
    }

    const { id, method, params } = msg;

    try {
      switch (method) {
        case 'rpc/hello': {
          const check = HelloParamsSchema.safeParse(params);
          if (!check.success) {
            this.sendError(ws, id, -32602, "Invalid params", check.error.format());
            return;
          }
          this.sendNotification(ws, 'rpc/welcome', {
            server: 'cic-daemon',
            version: '1.0.0',
          });
          break;
        }

        case 'session/create': {
          const check = SessionCreateParamsSchema.safeParse(params);
          if (!check.success) {
            this.sendError(ws, id, -32602, "Invalid params", check.error.format());
            return;
          }
          const sessionId = await this.handleSessionCreate(check.data);
          this.sendResponse(ws, id, { sessionId });
          break;
        }

        case 'session/update':
          await this.handleSessionUpdate(params);
          this.sendResponse(ws, id, { ok: true });
          break;

        case 'session/submit': {
          const check = SessionSubmitParamsSchema.safeParse(params);
          if (!check.success) {
            this.sendError(ws, id, -32602, "Invalid params", check.error.format());
            return;
          }
          const submitRes = await this.handleSessionSubmit(ws, check.data);
          this.sendResponse(ws, id, submitRes);
          break;
        }

        case 'ping':
          this.sendResponse(ws, id, { timestamp: Date.now() });
          break;

        default:
          this.sendError(ws, id, -32601, `Method not found: ${method}`);
      }
    } catch (err: any) {
      this.sendError(ws, id, 500, err.message || 'Internal error', { stack: err.stack });
    }
  }

  private sendResponse(ws: WebSocket, id: string | undefined, result: any) {
    if (!id) return;
    const resp: RpcResponse = { jsonrpc: '2.0', id, result };
    ws.send(JSON.stringify(resp));
  }

  private sendError(ws: WebSocket, id: string | undefined, code: number, message: string, data?: any) {
    if (!id) return;
    const resp: RpcResponse = { jsonrpc: '2.0', id, error: { code, message, data } };
    ws.send(JSON.stringify(resp));
  }

  private sendNotification(ws: WebSocket, method: string, params?: any) {
    const msg: RpcRequest = { jsonrpc: '2.0', method, params };
    ws.send(JSON.stringify(msg));
  }

  private async handleSessionCreate(params: any): Promise<string> {
    const sessionId = `cic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return sessionId;
  }

  private async handleSessionUpdate(params: any): Promise<void> {
    console.log(`[CIC Daemon] Updated session with params:`, params);
  }

  private async handleSessionSubmit(ws: WebSocket, params: { sessionId: string; prompt: string }): Promise<{ invocationId: string }> {
    const invocationId = `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    // Asynchronously run pipeline simulation
    setImmediate(async () => {
      const phases: Array<"validate" | "plan" | "execute" | "review" | "emit"> = [
        "validate",
        "plan",
        "execute",
        "review",
        "emit"
      ];

      for (let i = 0; i < phases.length; i++) {
        const current = phases[i];
        const previous = i > 0 ? phases[i - 1] : "validate";

        const transition = {
          sessionId: params.sessionId,
          invocationId,
          previousPhase: previous,
          currentPhase: current,
          timestamp: new Date().toISOString()
        };
        this.sendNotification(ws, "notification/phase/transition", transition);

        // Stream logs with correct log prefixes
        this.sendNotification(ws, "notification/log/stream", {
          sessionId: params.sessionId,
          invocationId,
          stream: "stdout",
          chunk: `### [CIC Daemon] [${current}] Processing...\n`
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });

    return { invocationId };
  }
}
