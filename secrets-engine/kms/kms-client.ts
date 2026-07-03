/*
  filename: kms-client.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import crypto from "crypto";
import fs from "fs";

export function loadKmsConfig() {
  return JSON.parse(
    fs.readFileSync("secrets-engine/kms/kms-config.json", "utf8")
  );
}

export function generateKey() {
  return crypto.randomBytes(32); // 256-bit key
}

export function encryptWithKey(key: Buffer, data: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, encrypted, tag };
}

export function decryptWithKey(key: Buffer, iv: Buffer, tag: Buffer, data: Buffer) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
