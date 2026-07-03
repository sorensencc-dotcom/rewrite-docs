import React from 'react';

export function SessionHealthDashboard({
  readiness,
  drift,
  ruleViolations,
  routedCounts
}: {
  readiness: number;
  drift: number;
  ruleViolations: number;
  routedCounts: {
    localLLM: number;
    gemini: number;
    claudeTQ: number;
    cic: number;
    appCode: number;
  };
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Session Health</h2>

      <p><strong>Readiness:</strong> {readiness.toFixed(2)}</p>
      <p><strong>Drift:</strong> {drift.toFixed(2)}</p>
      <p><strong>Rule Violations:</strong> {ruleViolations}</p>

      <h3>Routing</h3>
      <ul>
        <li>Local LLM: {routedCounts.localLLM}</li>
        <li>Gemini: {routedCounts.gemini}</li>
        <li>Claude/TQ: {routedCounts.claudeTQ}</li>
        <li>CIC: {routedCounts.cic}</li>
        <li>Engineer: {routedCounts.appCode}</li>
      </ul>
    </div>
  );
}
