import crypto from "crypto";

/**
 * Deterministic embedding for text. No network calls, no RNG.
 * Returns fixed-length array seeded by content hash.
 */
export function embedText(text: string): number[] {
  const hash = crypto.createHash("sha256").update(text).digest();
  const embedding: number[] = [];

  // Seed: first 8 bytes of hash as 64-bit double
  const seed = hash.readBigUInt64BE(0);
  let rng = Number(seed % BigInt(0x7fffffff));

  // Generate 768-dimensional embedding deterministically
  for (let i = 0; i < 768; i++) {
    rng = (rng * 1103515245 + 12345) % 0x7fffffff;
    embedding.push((rng % 100000) / 100000 - 0.5);
  }
  return embedding;
}

/**
 * Deterministic embedding for images. No network calls, no RNG.
 * Treats image binary as input to hash.
 */
export function embedImage(imageBinary: Buffer): number[] {
  const hash = crypto.createHash("sha256").update(imageBinary).digest();
  const embedding: number[] = [];

  // Seed: first 8 bytes of image hash
  const seed = hash.readBigUInt64BE(0);
  let rng = Number(seed % BigInt(0x7fffffff));

  // Generate 768-dimensional embedding deterministically
  for (let i = 0; i < 768; i++) {
    rng = (rng * 1103515245 + 12345) % 0x7fffffff;
    embedding.push((rng % 100000) / 100000 - 0.5);
  }
  return embedding;
}
