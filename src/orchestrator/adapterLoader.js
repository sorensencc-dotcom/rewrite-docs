// src/orchestrator/adapterLoader.ts
import { adapterRegistry } from "../adapters/index.js";
export function loadAdapter(name) {
    if (!adapterRegistry[name]) {
        throw new Error(`Unknown adapter: ${name}`);
    }
    return adapterRegistry[name]();
}
//# sourceMappingURL=adapterLoader.js.map