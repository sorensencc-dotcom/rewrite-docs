// src/cic-runtime/network/network-allowlist.ts
/**
 * Build docker flags for network allowlist enforcement.
 * Phase Sandbox-1: stub. Phase 2+ adds actual iptables rules.
 */
export function buildAllowlistFlags(networkMode) {
    switch (networkMode) {
        case "off":
            return "--network=none";
        case "strict":
            return "--network=none"; // no external network
        case "allowlist":
            return ""; // Phase 2: add --cap-add=NET_ADMIN + iptables rules
        case "none":
        default:
            return "--network=none";
    }
}
//# sourceMappingURL=network-allowlist.js.map