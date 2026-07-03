export function sanitizeFilename(filename: string): string {
  // Remove/replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Windows invalid chars
    .replace(/[\x00-\x1f]/g, '') // Control chars
    .replace(/^\.+/, '') // Leading dots
    .replace(/\s+$/, '') // Trailing whitespace
    .substring(0, 255); // Max filename length
}

export function sanitizePath(filePath: string): string {
  // Normalize path separators
  return filePath.replace(/\\/g, '/');
}

export function isValidMimeType(mimeType: string): boolean {
  const parts = mimeType.split('/');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
