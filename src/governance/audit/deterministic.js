export class DeterministicAudit {
    compiledPatterns = new Map();
    constructor() {
        // Pre-compile all regex patterns
        this.compilePatterns();
    }
    compilePatterns() {
        // Cache compiled regexes to avoid recompiling on every check
        const seenIds = new Set();
        // We'll compile on-demand instead, since policies may change
    }
    check(skillContent, policies) {
        const hard_fails = [];
        const flags = [];
        for (const policy of policies) {
            if (!policy.deterministic_check)
                continue;
            const matched = this.runCheck(skillContent, policy);
            if (!matched)
                continue;
            if (policy.deterministic_check.always_fail) {
                hard_fails.push(policy);
            }
            else {
                flags.push(policy);
            }
        }
        return { hard_fails, flags };
    }
    runCheck(content, policy) {
        const check = policy.deterministic_check;
        if (!check)
            return false;
        if (check.type === "regex") {
            return check.patterns.some((pattern) => {
                try {
                    const regex = new RegExp(pattern, "i");
                    return regex.test(content);
                }
                catch (e) {
                    console.error(`Invalid regex pattern in policy ${policy.id}: ${pattern}`);
                    return false;
                }
            });
        }
        if (check.type === "static_rule") {
            // For MISSING_SECTIONS, check if JSON is missing required fields
            if (policy.id === "MISSING_SECTIONS") {
                try {
                    const json = JSON.parse(content);
                    const requiredFields = ["name", "description", "scope", "out_of_scope", "examples"];
                    const missingFields = requiredFields.filter((f) => !(f in json));
                    return missingFields.length > 0;
                }
                catch {
                    // Not JSON, so MISSING_SECTIONS doesn't apply
                    return false;
                }
            }
            // Other static rules check for presence of patterns in content
            return check.patterns.some((section) => content.includes(`"${section}"`) ||
                content.includes(`'${section}'`) ||
                content.includes(`: ${section}`) ||
                content.includes(`= ${section}`));
        }
        // ast_pattern: placeholder for Phase 2
        if (check.type === "ast_pattern") {
            console.warn(`AST pattern checks not yet implemented for policy ${policy.id}`);
            return false;
        }
        return false;
    }
}
//# sourceMappingURL=deterministic.js.map