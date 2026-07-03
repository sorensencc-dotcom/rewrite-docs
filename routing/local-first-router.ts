/*
  filename: local-first-router.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import { route, CICState, BackendId } from "../src/maal/router/maal-routing-policy.js";
import { isLocalFirstEnabled } from "../runtime/config/runtime-config.js";
import { UnifiedChatRequest } from "../src/types/unifiedChatTypes.js";

const LOCAL_BACKENDS = new Set<BackendId>(["ollama", "localai", "gpt4all", "llamafile", "koboldcpp", "anythingllm", "mock"]);

export interface LocalFirstRoutePlan {
  backend: BackendId;
  localFirst: boolean;
}

export function routeLocalFirst(request: UnifiedChatRequest, cic: CICState): LocalFirstRoutePlan {
  if (!isLocalFirstEnabled()) {
    return { backend: route(request, cic), localFirst: false };
  }

  const enforced: UnifiedChatRequest = {
    ...request,
    routing: {
      ...request.routing,
      slo: {
        ...request.routing?.slo,
        offline_required: true,
        cost_ceiling: 0
      }
    },
    context: {
      ...request.context,
      tags: [...(request.context?.tags ?? []), "deterministic-replay", "sandbox"]
    }
  };

  const backend = route(enforced, cic);

  if (!LOCAL_BACKENDS.has(backend)) {
    throw new Error(
      `Local-first mode enforced but MAAL selected non-local backend: ${backend}. Failing hard to prevent silent breach of offline guarantee.`
    );
  }

  return { backend, localFirst: true };
}
