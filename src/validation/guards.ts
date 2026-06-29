/**
 * Guard functions: post-execution safety checks
 * Used by adapters to validate output before wrapping
 */

export function validateFinalUrl(url: any): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  const lower = url.toLowerCase();
  if (lower === 'about:blank') return false;
  if (lower.startsWith('data:')) return false;
  if (lower.startsWith('javascript:')) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePng(base64: string): boolean {
  if (!base64 || typeof base64 !== 'string') {
    return false;
  }

  try {
    const buffer = Buffer.from(base64, 'base64');
    // PNG header: 89 50 4E 47
    if (buffer.length < 4) return false;
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  } catch {
    return false;
  }
}

export function validateScreenshotSize(base64: string): boolean {
  if (!base64) return true; // Empty is OK

  try {
    const bytes = Buffer.from(base64, 'base64');
    const sizeMb = bytes.length / (1024 * 1024);
    return sizeMb <= 5;
  } catch {
    return false;
  }
}

export function sanitizeText(text: string): string {
  if (!text) return '';

  // Remove null bytes
  let result = text.replace(/\x00/g, '');

  // Remove ANSI escape codes (both literal [31m and escape sequence \x1b[31m)
  result = result.replace(/\x1b\[[0-9;]*m/g, ''); // Actual escape sequences
  result = result.replace(/\[[0-9;]*m/g, ''); // Literal bracket codes

  // Trim whitespace
  result = result.trim();

  return result;
}

export function validateTextLength(text: string): boolean {
  if (typeof text !== 'string') return false;
  const len = text.length;
  return len > 0 && len < 10_000;
}

export function validateJsonCompleteness(json: string): boolean {
  if (typeof json !== 'string' || json.length === 0) {
    return false;
  }

  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export function detectCrashInLogs(logs: string[]): boolean {
  if (!Array.isArray(logs)) return false;

  return logs.some(
    log => log.includes('Target closed') || log.includes('Protocol error')
  );
}

export function validatePageContent(content: string): void {
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Page content must not be empty');
  }

  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 128 * 1024) {
    throw new Error(`Page content exceeds maximum size of 128 KB (got ${bytes} bytes)`);
  }

  const utf8Buffer = Buffer.from(content, 'utf8');
  const decoded = utf8Buffer.toString('utf8');
  if (decoded !== content) {
    throw new Error('Page content is not UTF-8 safe');
  }
}

