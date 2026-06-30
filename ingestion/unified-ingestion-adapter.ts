/*
  filename: unified-ingestion-adapter.ts
  purpose: normalize docs + images into deterministic NormalizedAsset stream
  version: 1.0.0
  deterministic: yes (no RNG, no timestamps, seeded embeddings)
*/

import fs from "fs";
import crypto from "crypto";
import path from "path";

export interface NormalizedAsset {
  id: string;
  type: "document" | "image";
  rawPath: string;
  text?: string;
  metadata: {
    filename: string;
    size: number;
    hash: string;
  };
  embedding: number[];
}

/**
 * Deterministic embedding for text. No network calls, no RNG.
 * Returns fixed-length array seeded by content hash.
 */
function embedText(text: string): number[] {
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
function embedImage(imageBinary: Buffer): number[] {
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

/**
 * Compute deterministic asset ID: SHA256(type + rawPath + contentHash)
 */
function computeAssetId(type: string, rawPath: string, contentHash: string): string {
  const input = `${type}:${rawPath}:${contentHash}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Normalize a single document file into NormalizedAsset
 */
function normalizeDocument(docPath: string): NormalizedAsset {
  const text = fs.readFileSync(docPath, "utf8");
  const contentHash = crypto.createHash("sha256").update(text).digest("hex");
  const filename = path.basename(docPath);
  const stat = fs.statSync(docPath);

  const id = computeAssetId("document", docPath, contentHash);

  return {
    id,
    type: "document",
    rawPath: docPath,
    text,
    metadata: {
      filename,
      size: stat.size,
      hash: contentHash
    },
    embedding: embedText(text)
  };
}

/**
 * Normalize a single image file into NormalizedAsset
 */
function normalizeImage(imagePath: string): NormalizedAsset {
  const imageBinary = fs.readFileSync(imagePath);
  const contentHash = crypto.createHash("sha256").update(imageBinary).digest("hex");
  const filename = path.basename(imagePath);
  const stat = fs.statSync(imagePath);

  const id = computeAssetId("image", imagePath, contentHash);

  return {
    id,
    type: "image",
    rawPath: imagePath,
    metadata: {
      filename,
      size: stat.size,
      hash: contentHash
    },
    embedding: embedImage(imageBinary)
  };
}

/**
 * Main entry: normalize docs + images into deterministic stream
 * Sorted by path for reproducibility
 */
export function unifiedIngestionAdapter(input: {
  docs: string[];
  images: string[];
}): NormalizedAsset[] {
  const assets: NormalizedAsset[] = [];

  // Process docs in sorted order
  const sortedDocs = input.docs.slice().sort();
  for (const docPath of sortedDocs) {
    assets.push(normalizeDocument(docPath));
  }

  // Process images in sorted order
  const sortedImages = input.images.slice().sort();
  for (const imagePath of sortedImages) {
    assets.push(normalizeImage(imagePath));
  }

  // Return in sorted-by-id order for final determinism
  return assets.sort((a, b) => (a.id < b.id ? -1 : 1));
}
