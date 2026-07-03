import WebSocket from 'ws';

export interface RpcRequest {
  jsonrpc: '2.0';
  id?: string;
  method: string;
  params?: any;
}

export interface RpcResponse {
  jsonrpc: '2.0';
  id?: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class CicTransport {
  private ws: WebSocket | null = null;
  private pending = new Map<string, (resp: RpcResponse) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelayMs = 1000;
  private reconnectTimeoutHandle: NodeJS.Timeout | null = null;
  private manuallyClosed = false;

  constructor(private url: string) {}

  connect(): Promise<void> {
    this.manuallyClosed = false;
    return new Promise((resolve, reject) => {
      this.clearReconnectTimeout();
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log(`[VSC Cockpit] WebSocket connection established to ${this.url}`);
        this.reconnectAttempts = 0; // Reset reconnection counter on success
        this.sendNotification('rpc/hello', {
          client: 'vscode-extension',
          version: '1.0.0',
        });
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[VSC Cockpit] Connection closed: code=${code}, reason=${reason}`);
        if (!this.manuallyClosed) {
          this.triggerReconnect();
        }
      });

      this.ws.on('error', err => {
        console.error(`[VSC Cockpit] WebSocket connection error: ${err.message}`);
        // If first connection attempt fails, reject the promise
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
        if (!this.manuallyClosed) {
          this.triggerReconnect();
        }
      });
    });
  }

  close() {
    this.manuallyClosed = true;
    this.clearReconnectTimeout();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private triggerReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[VSC Cockpit] Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnects.`);
      return;
    }

    if (this.reconnectTimeoutHandle) return; // Reconnect is already scheduled

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[VSC Cockpit] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
    
    this.reconnectTimeoutHandle = setTimeout(() => {
      this.reconnectTimeoutHandle = null;
      this.connect().catch(err => {
        console.error(`[VSC Cockpit] Failed reconnect attempt: ${err.message}`);
      });
    }, delay);
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeoutHandle) {
      clearTimeout(this.reconnectTimeoutHandle);
      this.reconnectTimeoutHandle = null;
    }
  }

  private handleMessage(raw: string) {
    const msg = JSON.parse(raw) as RpcResponse | RpcRequest;

    if ('id' in msg && ((msg as RpcResponse).result !== undefined || (msg as RpcResponse).error)) {
      const resp = msg as RpcResponse;
      const handler = resp.id ? this.pending.get(resp.id) : undefined;
      if (handler) {
        handler(resp);
        if (resp.id) this.pending.delete(resp.id);
      }
      return;
    }

    const req = msg as RpcRequest;
    // Dispatch notifications (session/update, etc.) to listeners
    this.dispatchNotification(req);
  }

  private dispatchNotification(req: RpcRequest) {
    console.log(`[VSC Cockpit] Received notification: ${req.method}`, req.params);
  }

  sendRequest<T = any>(method: string, params?: any): Promise<T> {
    const id = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const req: RpcRequest = { jsonrpc: '2.0', id, method, params };

    return new Promise<T>((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }
      this.pending.set(id, resp => {
        if (resp.error) return reject(new Error(resp.error.message));
        resolve(resp.result as T);
      });
      this.ws.send(JSON.stringify(req));
    });
  }

  sendNotification(method: string, params?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg: RpcRequest = { jsonrpc: '2.0', method, params };
    this.ws.send(JSON.stringify(msg));
  }
}
