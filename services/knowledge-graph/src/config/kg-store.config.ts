// KG Storage Backend Configuration (Phase 29-31)
// Selects between SQLite (Phase 29), Postgres (Phase 31), or dual-write (Phase 31)

import { IKGStore, DualKGStore } from "../core/graph_store/IKGStore";
import { GraphStore } from "../core/graph_store/GraphStore";
import { SQLiteKGStore } from "../core/graph_store/SQLiteKGStore";
import { PostgresKGStore } from "../core/graph_store/PostgresKGStore";

export enum KGStoreMode {
  SQLITE = "sqlite",
  POSTGRES = "postgres",
  DUAL = "dual"
}

export interface KGStoreConfig {
  mode: KGStoreMode;
  sqlite?: {
    path: string;
  };
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    pool?: {
      min: number;
      max: number;
    };
  };
  readOnly?: boolean; // For audit/replay mode
}

/**
 * Parse KG_STORE_MODE environment variable and config
 * Returns configured IKGStore instance
 */
export async function createKGStore(config: KGStoreConfig): Promise<IKGStore> {
  const mode = process.env.KG_STORE_MODE || config.mode;

  switch (mode) {
    case KGStoreMode.SQLITE:
      if (!config.sqlite?.path) {
        throw new Error("KG_STORE_MODE=sqlite requires sqlite.path in config");
      }
      const graphStore = new GraphStore(config.sqlite.path);
      return new SQLiteKGStore(graphStore);

    case KGStoreMode.POSTGRES:
      if (!config.postgres) {
        throw new Error("KG_STORE_MODE=postgres requires postgres config");
      }
      return new PostgresKGStore(config.postgres);

    case KGStoreMode.DUAL:
      if (!config.sqlite?.path || !config.postgres) {
        throw new Error("KG_STORE_MODE=dual requires both sqlite and postgres config");
      }
      const graphStoreAudit = new GraphStore(config.sqlite.path);
      const auditStore = new SQLiteKGStore(graphStoreAudit);
      const liveStore = new PostgresKGStore(config.postgres);
      return new DualKGStore(auditStore, liveStore);

    default:
      throw new Error(
        `Unknown KG_STORE_MODE: ${mode}. Valid: ${Object.values(KGStoreMode).join(", ")}`
      );
  }
}

/**
 * Default config (Phase 29)
 * Override via environment variables:
 * - KG_STORE_MODE: sqlite | postgres | dual
 * - KG_SQLITE_PATH: /path/to/db.sqlite
 * - KG_POSTGRES_HOST: localhost
 * - KG_POSTGRES_PORT: 5432
 * - KG_POSTGRES_DB: knowledge_graph
 * - KG_POSTGRES_USER: postgres
 * - KG_POSTGRES_PASSWORD: (from env)
 */
export function getDefaultConfig(): KGStoreConfig {
  return {
    mode: (process.env.KG_STORE_MODE as KGStoreMode) || KGStoreMode.SQLITE,
    sqlite: {
      path: process.env.KG_SQLITE_PATH || "/app/data/kg.sqlite"
    },
    postgres: {
      host: process.env.KG_POSTGRES_HOST || "localhost",
      port: parseInt(process.env.KG_POSTGRES_PORT || "5432", 10),
      database: process.env.KG_POSTGRES_DB || "knowledge_graph",
      user: process.env.KG_POSTGRES_USER || "postgres",
      password: process.env.KG_POSTGRES_PASSWORD || "",
      pool: {
        min: parseInt(process.env.KG_POSTGRES_POOL_MIN || "2", 10),
        max: parseInt(process.env.KG_POSTGRES_POOL_MAX || "10", 10)
      }
    },
    readOnly: process.env.KG_READ_ONLY === "true"
  };
}
