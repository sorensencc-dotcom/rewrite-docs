export function chunkMarkdown(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text) return [];
  const paragraphs = text.split("\n\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        const tailStart = Math.max(0, currentChunk.length - overlap);
        currentChunk = currentChunk.substring(tailStart).trim();
      }
      
      if (trimmedPara.length > chunkSize) {
        let remaining = trimmedPara;
        while (remaining.length > 0) {
          const piece = remaining.substring(0, chunkSize);
          chunks.push(piece);
          remaining = remaining.substring(chunkSize - overlap);
          if (remaining.length <= overlap) {
            currentChunk = remaining;
            break;
          }
        }
      } else {
        currentChunk = (currentChunk ? currentChunk + "\n\n" : "") + trimmedPara;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
