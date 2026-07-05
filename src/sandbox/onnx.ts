import * as crypto from 'crypto';

export async function embed(text: string): Promise<number[]> {
  try {
    const ort = await import('onnxruntime-node');
    // TODO: Load ONNX model and run inference
    const hash = crypto.createHash('sha256').update(text).digest();
    return Array.from(hash).slice(0, 384).map(b => b / 255);
  } catch {
    // Deterministic fallback if onnxruntime-node unavailable
    const hash = crypto.createHash('sha256').update(text).digest();
    return Array.from(hash).slice(0, 384).map(b => b / 255);
  }
}

export async function runInference(data: any): Promise<number[]> {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
  return Array.from(hash).slice(0, 16).map(b => (b - 127.5) / 127.5);
}
