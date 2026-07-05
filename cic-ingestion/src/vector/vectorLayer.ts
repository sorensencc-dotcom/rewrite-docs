export interface VectorSearchResult {
  id: string;
  score: number;
  payload?: any;
}

export class VectorLayer {
  async search(query: any): Promise<VectorSearchResult[]> {
    return [];
  }

  async insert(id: string, vector: number[]): Promise<void> {
    return;
  }
}
