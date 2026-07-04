import { RepoHistorySlice } from '../../GraphContext.js';

export const mockRepoHistorySlice: RepoHistorySlice = {
  commits: [
    { hash: "commit-1", message: "feat: add unified graph context", author: "dev1", date: "2026-07-04T00:00:00Z" },
    { hash: "commit-2", message: "fix: resolve parallel git lock race", author: "dev2", date: "2026-07-03T12:00:00Z" }
  ],
  authors: [
    { name: "dev1", email: "dev1@example.com", commitsCount: 142 },
    { name: "dev2", email: "dev2@example.com", commitsCount: 98 }
  ],
  blastRadius: {
    affectedFiles: ["src/harvester/index.ts", "src/discovery/index.ts", "src/lib/drift.ts"],
    impactScore: 0.72,
    coChanges: [
      { fileA: "src/harvester/index.ts", fileB: "src/schemas/index.ts", occurrences: 12 }
    ]
  },
  volatility: 0.35,
  changeTimeline: [
    { eventId: "evt-1", timestamp: "2026-07-04T00:00:00Z", type: "commit", message: "feat: add unified graph context" }
  ],
  churn: 450,
  ownership: [
    { file: "src/lib/drift.ts", owner: "dev1", percentage: 85 }
  ]
};
