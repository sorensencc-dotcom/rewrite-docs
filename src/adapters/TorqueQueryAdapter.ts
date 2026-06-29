// src/adapters/TorqueQueryAdapter.ts
export class TorqueQueryAdapter {
  async run(action: string, payload: any): Promise<any> {
    return { ok: true };
  }
}
