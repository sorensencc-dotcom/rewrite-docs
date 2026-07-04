export const RefactorPolicy = {
  name: "CIC.CodeRefactor",
  require: ["TrueCode", "GitNexus"] as const,
  optional: ["Graphify"] as const,
  mergeStrategy: "structural-first" as const
};
export type RefactorPolicyType = typeof RefactorPolicy;
