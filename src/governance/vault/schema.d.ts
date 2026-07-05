import { z } from "zod";
export declare const VaultRecordBaseSchema: z.ZodObject<{
    vault_record_id: z.ZodString;
    schema_version: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    vault_record_id: string;
    schema_version: string;
    created_at: string;
}, {
    vault_record_id: string;
    schema_version: string;
    created_at: string;
}>;
export declare const BuildMetadataSchema: z.ZodObject<{
    build_id: z.ZodString;
    cic_pipeline_id: z.ZodString;
    git: z.ZodObject<{
        repo: z.ZodString;
        branch: z.ZodString;
        commit_sha: z.ZodString;
        tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    }, {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    }>;
    environment: z.ZodObject<{
        builder_image: z.ZodString;
        cic_cli_version: z.ZodString;
        os: z.ZodString;
        toolchain_fingerprint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    }, {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    }>;
}, "strip", z.ZodTypeAny, {
    build_id: string;
    environment: {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    };
    cic_pipeline_id: string;
    git: {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    };
}, {
    build_id: string;
    environment: {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    };
    cic_pipeline_id: string;
    git: {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    };
}>;
export declare const ArtifactMetadataSchema: z.ZodObject<{
    type: z.ZodEnum<["binary", "container", "bundle"]>;
    coordinates: z.ZodObject<{
        group: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        qualifier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    }, {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    }>;
    artifact_store_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    digest: z.ZodString;
    size_bytes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "container" | "binary" | "bundle";
    coordinates: {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    };
    digest: string;
    size_bytes: number;
    artifact_store_ref?: string | null | undefined;
}, {
    type: "container" | "binary" | "bundle";
    coordinates: {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    };
    digest: string;
    size_bytes: number;
    artifact_store_ref?: string | null | undefined;
}>;
export declare const TestSummarySchema: z.ZodObject<{
    total: z.ZodNumber;
    passed: z.ZodNumber;
    failed: z.ZodNumber;
    skipped: z.ZodNumber;
    report_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    failed: number;
    passed: number;
    total: number;
    skipped: number;
    report_ref?: string | null | undefined;
}, {
    failed: number;
    passed: number;
    total: number;
    skipped: number;
    report_ref?: string | null | undefined;
}>;
export declare const LineageMetadataSchema: z.ZodObject<{
    sbom_ref: z.ZodString;
    provenance_ref: z.ZodString;
    determinism_hash: z.ZodString;
    test_summary: z.ZodObject<{
        total: z.ZodNumber;
        passed: z.ZodNumber;
        failed: z.ZodNumber;
        skipped: z.ZodNumber;
        report_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    }, {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    sbom_ref: string;
    provenance_ref: string;
    determinism_hash: string;
    test_summary: {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    };
}, {
    sbom_ref: string;
    provenance_ref: string;
    determinism_hash: string;
    test_summary: {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    };
}>;
export declare const CouncilVoteSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodEnum<["human", "service"]>;
    vote: z.ZodEnum<["Approve", "Block", "Abstain"]>;
    timestamp: z.ZodString;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    id: string;
    role: "human" | "service";
    vote: "Approve" | "Block" | "Abstain";
    signature: string;
}, {
    timestamp: string;
    id: string;
    role: "human" | "service";
    vote: "Approve" | "Block" | "Abstain";
    signature: string;
}>;
export declare const GovernanceDecisionSchema: z.ZodObject<{
    decision: z.ZodEnum<["Approved", "Blocked", "NeedsRevision"]>;
    decision_reason: z.ZodString;
    policy_version: z.ZodString;
    council: z.ZodObject<{
        members: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodEnum<["human", "service"]>;
            vote: z.ZodEnum<["Approve", "Block", "Abstain"]>;
            timestamp: z.ZodString;
            signature: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }, {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }>, "many">;
        quorum_met: z.ZodBoolean;
        decision_signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    }, {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    }>;
}, "strip", z.ZodTypeAny, {
    decision: "Approved" | "Blocked" | "NeedsRevision";
    policy_version: string;
    decision_reason: string;
    council: {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    };
}, {
    decision: "Approved" | "Blocked" | "NeedsRevision";
    policy_version: string;
    decision_reason: string;
    council: {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    };
}>;
export declare const SigningRecordSchema: z.ZodObject<{
    signing_status: z.ZodEnum<["Pending", "Signed", "Failed"]>;
    signing_key_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    signature_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    signing_timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    signing_status: "Failed" | "Pending" | "Signed";
    signing_key_id?: string | null | undefined;
    signature_ref?: string | null | undefined;
    signing_timestamp?: string | null | undefined;
}, {
    signing_status: "Failed" | "Pending" | "Signed";
    signing_key_id?: string | null | undefined;
    signature_ref?: string | null | undefined;
    signing_timestamp?: string | null | undefined;
}>;
export declare const PromotionRecordSchema: z.ZodObject<{
    promotion_status: z.ZodEnum<["NotPromoted", "Promoted", "Rollback"]>;
    target_environment: z.ZodOptional<z.ZodEnum<["dev", "staging", "prod"]>>;
    promotion_timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    initiator: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    promotion_status: "NotPromoted" | "Promoted" | "Rollback";
    target_environment?: "dev" | "prod" | "staging" | undefined;
    promotion_timestamp?: string | null | undefined;
    initiator?: string | undefined;
}, {
    promotion_status: "NotPromoted" | "Promoted" | "Rollback";
    target_environment?: "dev" | "prod" | "staging" | undefined;
    promotion_timestamp?: string | null | undefined;
    initiator?: string | undefined;
}>;
export declare const AuditEnvelopeSchema: z.ZodObject<{
    request_id: z.ZodString;
    ci_job_id: z.ZodString;
    ip_or_node_id: z.ZodString;
    extra_metadata: z.ZodOptional<z.ZodObject<{
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        labels?: Record<string, string> | undefined;
    }, {
        labels?: Record<string, string> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    request_id: string;
    ci_job_id: string;
    ip_or_node_id: string;
    extra_metadata?: {
        labels?: Record<string, string> | undefined;
    } | undefined;
}, {
    request_id: string;
    ci_job_id: string;
    ip_or_node_id: string;
    extra_metadata?: {
        labels?: Record<string, string> | undefined;
    } | undefined;
}>;
export declare const GovernanceVaultRecord24_5Schema: z.ZodObject<{
    vault_record_id: z.ZodString;
    schema_version: z.ZodString;
    created_at: z.ZodString;
} & {
    build_id: z.ZodString;
    cic_pipeline_id: z.ZodString;
    git: z.ZodObject<{
        repo: z.ZodString;
        branch: z.ZodString;
        commit_sha: z.ZodString;
        tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    }, {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    }>;
    environment: z.ZodObject<{
        builder_image: z.ZodString;
        cic_cli_version: z.ZodString;
        os: z.ZodString;
        toolchain_fingerprint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    }, {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    }>;
} & {
    sbom_ref: z.ZodString;
    provenance_ref: z.ZodString;
    determinism_hash: z.ZodString;
    test_summary: z.ZodObject<{
        total: z.ZodNumber;
        passed: z.ZodNumber;
        failed: z.ZodNumber;
        skipped: z.ZodNumber;
        report_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    }, {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    }>;
} & {
    type: z.ZodEnum<["binary", "container", "bundle"]>;
    coordinates: z.ZodObject<{
        group: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        qualifier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    }, {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    }>;
    artifact_store_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    digest: z.ZodString;
    size_bytes: z.ZodNumber;
} & {
    decision: z.ZodEnum<["Approved", "Blocked", "NeedsRevision"]>;
    decision_reason: z.ZodString;
    policy_version: z.ZodString;
    council: z.ZodObject<{
        members: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodEnum<["human", "service"]>;
            vote: z.ZodEnum<["Approve", "Block", "Abstain"]>;
            timestamp: z.ZodString;
            signature: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }, {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }>, "many">;
        quorum_met: z.ZodBoolean;
        decision_signature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    }, {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    }>;
} & {
    signing_status: z.ZodEnum<["Pending", "Signed", "Failed"]>;
    signing_key_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    signature_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    signing_timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
} & {
    promotion_status: z.ZodEnum<["NotPromoted", "Promoted", "Rollback"]>;
    target_environment: z.ZodOptional<z.ZodEnum<["dev", "staging", "prod"]>>;
    promotion_timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    initiator: z.ZodOptional<z.ZodString>;
} & {
    request_id: z.ZodString;
    ci_job_id: z.ZodString;
    ip_or_node_id: z.ZodString;
    extra_metadata: z.ZodOptional<z.ZodObject<{
        labels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        labels?: Record<string, string> | undefined;
    }, {
        labels?: Record<string, string> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "container" | "binary" | "bundle";
    decision: "Approved" | "Blocked" | "NeedsRevision";
    build_id: string;
    policy_version: string;
    environment: {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    };
    vault_record_id: string;
    schema_version: string;
    created_at: string;
    cic_pipeline_id: string;
    git: {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    };
    coordinates: {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    };
    digest: string;
    size_bytes: number;
    sbom_ref: string;
    provenance_ref: string;
    determinism_hash: string;
    test_summary: {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    };
    decision_reason: string;
    council: {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    };
    signing_status: "Failed" | "Pending" | "Signed";
    promotion_status: "NotPromoted" | "Promoted" | "Rollback";
    request_id: string;
    ci_job_id: string;
    ip_or_node_id: string;
    artifact_store_ref?: string | null | undefined;
    signing_key_id?: string | null | undefined;
    signature_ref?: string | null | undefined;
    signing_timestamp?: string | null | undefined;
    target_environment?: "dev" | "prod" | "staging" | undefined;
    promotion_timestamp?: string | null | undefined;
    initiator?: string | undefined;
    extra_metadata?: {
        labels?: Record<string, string> | undefined;
    } | undefined;
}, {
    type: "container" | "binary" | "bundle";
    decision: "Approved" | "Blocked" | "NeedsRevision";
    build_id: string;
    policy_version: string;
    environment: {
        os: string;
        builder_image: string;
        cic_cli_version: string;
        toolchain_fingerprint: string;
    };
    vault_record_id: string;
    schema_version: string;
    created_at: string;
    cic_pipeline_id: string;
    git: {
        repo: string;
        branch: string;
        commit_sha: string;
        tag?: string | null | undefined;
    };
    coordinates: {
        name: string;
        version: string;
        group: string;
        qualifier?: string | null | undefined;
    };
    digest: string;
    size_bytes: number;
    sbom_ref: string;
    provenance_ref: string;
    determinism_hash: string;
    test_summary: {
        failed: number;
        passed: number;
        total: number;
        skipped: number;
        report_ref?: string | null | undefined;
    };
    decision_reason: string;
    council: {
        members: {
            timestamp: string;
            id: string;
            role: "human" | "service";
            vote: "Approve" | "Block" | "Abstain";
            signature: string;
        }[];
        quorum_met: boolean;
        decision_signature: string;
    };
    signing_status: "Failed" | "Pending" | "Signed";
    promotion_status: "NotPromoted" | "Promoted" | "Rollback";
    request_id: string;
    ci_job_id: string;
    ip_or_node_id: string;
    artifact_store_ref?: string | null | undefined;
    signing_key_id?: string | null | undefined;
    signature_ref?: string | null | undefined;
    signing_timestamp?: string | null | undefined;
    target_environment?: "dev" | "prod" | "staging" | undefined;
    promotion_timestamp?: string | null | undefined;
    initiator?: string | undefined;
    extra_metadata?: {
        labels?: Record<string, string> | undefined;
    } | undefined;
}>;
//# sourceMappingURL=schema.d.ts.map