// harvester-bridge/resolver.ts
// semver: 0.1.0
// date: 2026-06-29

import fs from "fs";
import path from "path";

export interface IngestionJob {
  type: string;
  payload: {
    path: string;
  };
}

export function resolveJob(job: IngestionJob): any[] {
  if (job.type === "client_session") {
    const file = path.resolve(process.cwd(), job.payload?.path || "cic-ingestion/logs/client_sessions.jsonl");
    if (!fs.existsSync(file)) {
      return [];
    }
    const content = fs.readFileSync(file, "utf8").trim();
    if (!content) {
      return [];
    }
    return content.split("\n").map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
  return [];
}
