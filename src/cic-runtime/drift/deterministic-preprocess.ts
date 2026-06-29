import * as crypto from 'crypto';

export function preprocessText(text: string, seed?: number): string {
  if (seed === undefined) return text;
  
  const h = crypto.createHash('sha256').update(String(seed)).digest();
  const mask = h[0] % 3;
  
  if (mask === 0) return text;
  if (mask === 1) return text.toUpperCase();
  return text.toLowerCase();
}
