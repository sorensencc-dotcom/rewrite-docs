import { embedText } from '../../../../../shared/embedding';

/**
 * Embeds a batch of chunks asynchronously (compatible with the requested embed interface).
 */
export async function embedChunks(chunks: Array<{ text: string }>): Promise<number[][]> {
  return chunks.map(chunk => embedText(chunk.text));
}

export { embedText };
