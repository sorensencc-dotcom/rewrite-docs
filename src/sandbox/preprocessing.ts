import { preprocessText } from '../cic-runtime/drift/deterministic-preprocess';

export function preprocess(text: string, seed?: number): any {
  return {
    original: text,
    processed: preprocessText(text, seed),
    seed: seed || 0,
  };
}
