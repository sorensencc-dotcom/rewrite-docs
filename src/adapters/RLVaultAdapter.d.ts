/**
 * RLVaultAdapter
 * Ingests Rewrite Labs reference vault into TorqueQuery vector index.
 * 6-stage pipeline: discover → harvest → normalize → chunk → embed → index
 */
import { AdapterResponse } from "../validation/envelope";
export declare class RLVaultAdapter {
    private vaultPath;
    private manifestPath;
    private manifest;
    constructor(vaultPath?: string, manifestPath?: string);
    run(action: string, payload: any): Promise<AdapterResponse<any>>;
    /**
     * Stage 1: Discover
     * Scan vault and verify against manifest.
     */
    private discover;
    /**
     * Stage 2: Harvest
     * Read files with UTF-8, extract frontmatter, infer titles.
     */
    private harvest;
    /**
     * Stage 3: Normalize
     * Apply CIC normalization: strip HTML comments (except SYNC), normalize headings, resolve links.
     */
    private normalize;
    /**
     * Stage 4: Chunk
     * Deterministic chunking: max 1200 chars, 120 char overlap.
     * Chunk IDs: rlv-{sha256-of-path}-{index}
     */
    private chunk;
    /**
     * Stage 5: Embed
     * Call TorqueQuery embedding service with deterministic seed.
     * Uses LocalEmbeddingModel with fixed seed (42) for reproducibility.
     */
    private embed;
    /**
     * Stage 6: Index
     * Store vectors in Qdrant "rl-vault" collection.
     * Makes embeddings queryable by TorqueQuery.
     */
    private index;
    /**
     * Full pipeline orchestration
     */
    private runFullPipeline;
    private loadManifest;
}
//# sourceMappingURL=RLVaultAdapter.d.ts.map