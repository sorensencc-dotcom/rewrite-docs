import * as React from 'react';
import { RoutingMessage } from "../../gemini-coach/src/messaging/routingMessages";

// 1. Review Code Panel
export function ReviewCodePanel({ filePath, messages, onApplyFixes, onShowDetails }: any) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Review Code</h2>
      <p>File: <strong>{filePath}</strong></p>
      <h3>Issues Detected</h3>
      <ul>
        {messages.map((m: any) => (
          <li key={m.id}>
            <strong>{m.title}</strong>
            <pre style={{ whiteSpace: "pre-wrap" }}>{m.body}</pre>
          </li>
        ))}
      </ul>
      <button onClick={onApplyFixes}>Apply Local Fixes</button>
      <button onClick={onShowDetails} style={{ marginLeft: 8 }}>Show Routing Details</button>
    </div>
  );
}

// 2. Fix Preview
export function FixPreview({ original, patched, onAccept, onReject }: any) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Fix Preview</h2>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}><h3>Original</h3><pre>{original}</pre></div>
        <div style={{ flex: 1 }}><h3>Patched</h3><pre>{patched}</pre></div>
      </div>
      <button onClick={onAccept}>Apply Fix</button>
      <button onClick={onReject} style={{ marginLeft: 8 }}>Cancel</button>
    </div>
  );
}

// 3. Skill Opportunities
export function SkillOpportunities({ skills }: any) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Skill Opportunities</h2>
      {skills.length === 0 && <p>No emerging skills detected.</p>}
      {skills.map((skill: any) => (
        <div key={skill.name} style={{ marginBottom: 20 }}>
          <h3>{skill.name}</h3>
          <p><strong>Stability:</strong> {(skill.stability * 100).toFixed(1)}%</p>
          <p>{skill.description}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

// 4. Drift Timeline
export function DriftTimeline({ data }: any) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Drift Timeline</h2>
      <svg width="100%" height="200">
        {data.map((point: any, i: number) => {
          const x = (i / (data.length - 1)) * 800;
          const y = 180 - point.drift * 180;
          return (
            <circle key={i} cx={x} cy={y} r={4} fill="orange">
              <title>{point.timestamp}{"\n"}Drift: {point.drift.toFixed(2)}{"\n"}Contributors: {point.contributors.join(", ")}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

// 5. Layout Container
export function LayoutContainer({ activePanel, reviewData, fixPreview, skills, driftData, onApplyFixes, onShowDetails, onAcceptPatch, onRejectPatch }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {activePanel === "review" && <ReviewCodePanel filePath={reviewData.filePath} messages={reviewData.messages} onApplyFixes={onApplyFixes} onShowDetails={onShowDetails} />}
      {activePanel === "fixPreview" && <FixPreview original={fixPreview.original} patched={fixPreview.patched} onAccept={onAcceptPatch} onReject={onRejectPatch} />}
      {activePanel === "skills" && <SkillOpportunities skills={skills} />}
      {activePanel === "drift" && <DriftTimeline data={driftData} />}
    </div>
  );
}

// 6. Review Code Command Palette
export function ReviewCodeCommandPalette({ onReview, onShowLastReview, onOpenSettings }: any) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Gemini Coach — Commands</h2>
      <button onClick={onReview}>Review Current File</button>
      <button onClick={onShowLastReview} style={{ marginTop: 8 }}>Show Last Review Summary</button>
      <button onClick={onOpenSettings} style={{ marginTop: 8 }}>Coach Settings</button>
    </div>
  );
}

// 7. Animations (Accept/Reject)
export function AcceptAnimation() { return <div style={{ position: "absolute", inset: 0, background: "rgba(0,255,0,0.15)", animation: "acceptFlash 0.6s ease-out forwards", pointerEvents: "none" }} />; }
export function RejectAnimation() { return <div style={{ position: "absolute", inset: 0, animation: "rejectShake 0.4s ease-out forwards", pointerEvents: "none" }} />; }

// 8. Session Health Dashboard
export function SessionHealthDashboard({ readiness, drift, ruleViolations, routedCounts }: any) {
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
