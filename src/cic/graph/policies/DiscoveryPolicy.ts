export const DiscoveryPolicy = {
  name: "CIC.Discovery",
  require: ["Graphify"] as const,
  optional: ["TrueCode", "GitNexus"] as const,
  mergeStrategy: "knowledge-first" as const
};
export type DiscoveryPolicyType = typeof DiscoveryPolicy;
