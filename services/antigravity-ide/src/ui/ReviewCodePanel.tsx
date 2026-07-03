import React from 'react';
import { RoutingMessage } from "../../../gemini-coach/src/messaging/routingMessages";

export function ReviewCodePanel({
  filePath,
  messages,
  onApplyFixes,
  onShowDetails
}: {
  filePath: string;
  messages: RoutingMessage[];
  onApplyFixes: () => void;
  onShowDetails: () => void;
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Review Code</h2>
      <p>File: <strong>{filePath}</strong></p>

      <h3>Issues Detected</h3>
      <ul>
        {messages.map(m => (
          <li key={m.id}>
            <strong>{m.title}</strong>
            <pre style={{ whiteSpace: "pre-wrap" }}>{m.body}</pre>
          </li>
        ))}
      </ul>

      <button onClick={onApplyFixes}>Apply Local Fixes</button>
      <button onClick={onShowDetails} style={{ marginLeft: 8 }}>
        Show Routing Details
      </button>
    </div>
  );
}
