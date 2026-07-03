/*
  filename: local-first-bus.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import crypto from "crypto";

export interface Message {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: unknown;
  payloadHash: string;
  prevId: string | null;
  timestamp: number;
}

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  });
  return sorted;
}

function hashPayload(payload: unknown): string {
  const sorted = sortKeys(payload);
  const data = Buffer.from(JSON.stringify(sorted));
  return crypto.createHash("sha256").update(data).digest("hex");
}

export class LocalFirstBus {
  private queues: Map<string, Message[]> = new Map();
  private seq = 0;

  private channelKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  send(from: string, to: string, type: string, payload: unknown): Message {
    const channel = this.channelKey(from, to);
    const queue = this.queues.get(channel) || [];
    const prev = queue.length ? queue[queue.length - 1].id : null;

    const payloadHash = hashPayload(payload);
    const hashInput = `${channel}:${this.seq}:${payloadHash}:${prev ?? "null"}`;
    const id = crypto.createHash("sha256").update(hashInput).digest("hex");

    const msg: Message = {
      id,
      from,
      to,
      type,
      payload,
      payloadHash,
      prevId: prev,
      timestamp: this.seq++
    };

    queue.push(msg);
    this.queues.set(channel, queue);
    return msg;
  }

  receive(to: string): Message | null {
    const channels = Array.from(this.queues.entries()).filter(([key]) =>
      key.endsWith(`->${to}`)
    );

    let oldestMsg: Message | null = null;
    let oldestChannelKey: string | null = null;

    for (const [key, queue] of channels) {
      if (queue.length) {
        const head = queue[0];
        if (oldestMsg === null || head.timestamp < oldestMsg.timestamp) {
          oldestMsg = head;
          oldestChannelKey = key;
        }
      }
    }

    if (oldestMsg && oldestChannelKey) {
      const queue = this.queues.get(oldestChannelKey)!;
      queue.shift();
      this.queues.set(oldestChannelKey, queue);
      return oldestMsg;
    }

    return null;
  }

  dump(): Message[] {
    const all: Message[] = [];
    const channels = Array.from(this.queues.keys()).sort();
    for (const channel of channels) {
      all.push(...(this.queues.get(channel) || []));
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }
}
