export interface QdrantSearchResult {
  id: string;
  score: number;
  payload?: any;
}

export class QdrantClient {
  async search(collection: string, query: any): Promise<QdrantSearchResult[]> {
    return [];
  }

  async health(): Promise<boolean> {
    return true;
  }

  async stats(collection: string): Promise<any> {
    return {};
  }
}
