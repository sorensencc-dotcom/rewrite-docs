import React from 'react';
import { RoutingMessage } from "../../../gemini-coach/src/messaging/routingMessages";

export function RoutingBreakdownInspector({
  messages
}: {
  messages: RoutingMessage[];
}) {
  const groups: Record<string, RoutingMessage[]> = {
    LOCAL_LLM_FIXABLE: [],
    LOCAL_LLM_PARTIAL: [],
    GEMINI_ISSUES: [],
    CLAUDE_TQ_ISSUES: [],
    CIC_ISSUES: [],
    ENGINEER_ISSUES: [],
    ROUTING_SUMMARY: []
  };

  messages.forEach(m => {
    if (groups[m.type]) {
      groups[m.type].push(m);
    }
  });

  return (
    <div style={{ padding: 16 }}>
      <h2>Routing Breakdown</h2>

      {Object.entries(groups).map(([type, msgs]) =>
        msgs.length > 0 ? (
          <div key={type} style={{ marginBottom: 20 }}>
            <h3>{type.replace(/_/g, " ")}</h3>
            {msgs.map(m => (
              <div key={m.id} style={{ marginBottom: 12 }}>
                <strong>{m.title}</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{m.body}</pre>
              </div>
            ))}
            <hr />
          </div>
        ) : null
      )}
    </div>
  );
}
