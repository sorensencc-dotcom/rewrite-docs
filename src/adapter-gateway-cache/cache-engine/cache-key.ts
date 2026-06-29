import crypto from "crypto";

export class CacheKeyGenerator {
  static compute(input: any): string {
    const normalized = this.normalize(input);
    const json = JSON.stringify(normalized);
    return crypto.createHash("sha256").update(json).digest("hex");
  }

  static computeWithAdapter(adapterId: string, input: any): string {
    const combined = {
      adapter: adapterId,
      payload: this.normalize(input),
    };
    const json = JSON.stringify(combined);
    return crypto.createHash("sha256").update(json).digest("hex");
  }

  private static normalize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.normalize(item));

    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.normalize(obj[key]);
      });
    return sorted;
  }

  static hash(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex");
  }

  static isValidKey(key: string): boolean {
    return /^[a-f0-9]{64}$/.test(key);
  }
}
