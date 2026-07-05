export type ISO8601 = string;
export interface SkillSourceRepo {
    url: string;
    branch: string;
    remotePath: string;
    lastSyncCommit: string;
}
export interface SkillModification {
    type: "perf-optimization" | "bug-fix" | "feature" | "test-coverage" | "error-handling";
    description: string;
    dateModified: ISO8601;
    prNumber?: number;
    prUrl?: string;
    prStatus?: "open" | "merged" | "closed";
}
export interface SkillManifestEntry {
    id: string;
    name: string;
    localPath: string;
    sourceRepo: SkillSourceRepo;
    available: boolean;
    localModified: boolean;
    modifications?: SkillModification[];
    lastMergedAt?: ISO8601;
}
export interface SkillManifest {
    version: string;
    lastUpdated: ISO8601;
    skills: SkillManifestEntry[];
}
export type ContributionStatus = "open" | "merged" | "closed" | "rejected";
export interface SkillContribution {
    skillId: string;
    skillName: string;
    prNumber: number;
    upstreamRepo: string;
    prUrl: string;
    status: ContributionStatus;
    createdAt: ISO8601;
    lastChecked: ISO8601;
    author: string;
    type: "perf-optimization" | "bug-fix" | "feature" | "test-coverage" | "error-handling";
    description: string;
    notes?: string;
}
export interface SkillManifestRecord {
    id: number;
    skill_id: string;
    skill_name: string;
    local_path: string;
    source_repo_url: string;
    source_repo_branch: string;
    source_repo_path: string;
    last_sync_commit: string;
    is_available: boolean;
    is_locally_modified: boolean;
    modification_count: number;
    created_at: ISO8601;
    updated_at: ISO8601;
}
export interface SkillContributionRecord {
    id: number;
    skill_id: string;
    pr_number: number;
    pr_url: string;
    pr_branch: string;
    upstream_repo_url: string;
    status: ContributionStatus;
    status_updated_at: ISO8601 | null;
    contribution_type: string;
    contribution_description: string | null;
    change_summary: string | null;
    lines_added: number | null;
    lines_deleted: number | null;
    author: string;
    created_at: ISO8601;
    updated_at: ISO8601;
    last_checked_at: ISO8601 | null;
    linked_skill_lineage_id: number | null;
    notes: string | null;
}
//# sourceMappingURL=skill-manifest.d.ts.map