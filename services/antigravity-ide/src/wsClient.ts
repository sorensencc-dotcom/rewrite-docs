import { CoachEvent } from "./events";

export class CoachWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: ((event: CoachEvent) => void)[] = [];

  async connect(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onmessage = msg => {
      const event = JSON.parse(msg.data) as CoachEvent;
      this.listeners.forEach(cb => cb(event));
    };

    return new Promise<void>(resolve => {
      this.socket!.onopen = () => resolve();
    });
  }

  onEvent(cb: (event: CoachEvent) => void) {
    this.listeners.push(cb);
  }
}
