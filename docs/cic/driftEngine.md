---
title: driftEngine
summary: ""
created: "2026-07-03T19:44:37.647Z"
updated: "2026-07-03T19:44:37.647Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Drift Engine & Decay Algorithms

The Drift Engine tracks quality degradation across providers and models, ensuring that drift scores reflect recent performance and stabilize over time.

---

## 🧮 1. Penalty Scoring Matrix

When the ingestion daemon parses a log record, it evaluates SLA breaches and increments provider drift scores:

$$\Delta S = \begin{cases} 
0.0 & \text{if } D < 0.2 \\
0.1 & \text{if } 0.2 \le D < 0.4 \\
0.3 & \text{if } 0.4 \le D < 0.6 \\
0.5 & \text{if } D \ge 0.6 
\end{cases}$$

Where:
* $D$ is the evaluated document drift ($1.0 - \text{similarityScore}$).
* $\Delta S$ is the added penalty.

---

## 📉 2. Decay Cycle

Every 30 seconds, the drift engine applies uniform exponential decay to all active drift scores:

$$S_{t+1} = S_t \times 0.95$$

### Snapping Threshold
To avoid trailing fractions, scores decay to 0:

$$\text{if } S_{t+1} < 0.01 \text{ then } S_{t+1} = 0.00$$

All decay events are logged as `"drift_decay"` events in the cryptographic audit trail.
