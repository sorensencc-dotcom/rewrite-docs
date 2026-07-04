export const DriftPolicy = {
  name: "CIC.Drift",
  require: ["Graphify", "TrueCode", "GitNexus"] as const,
  optional: [] as const,
  mergeStrategy: "knowledge-first" as const
};
export type DriftPolicyType = typeof DriftPolicy;
