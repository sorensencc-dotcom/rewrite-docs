# Feedback Loop & Playbook Test Matrix

The Feedback Loop tests ensure the control plane responds correctly to SLA breaches, applies drift decay, and runs recovery runbooks.

---

## 📈 1. SLA Breach Tests

* **Case 1: Latency Violation**
  * **Trigger:** Provider execution time exceeds `1500ms`.
  * **Result:** SLA breach recorded, `driftSpike` playbook enabled, and provider drift score penalized.

* **Case 2: Backlog Breach**
  * **Trigger:** Processed lines count indicates backlog size `> 1000`.
  * **Result:** `ingestionRecovery` playbook enabled, SEV-2 alert raised in console.

---

## 🔁 2. Drift Decay Tests

* **Case 3: Exponential Decay Evaluation**
  * **Trigger:** Ingestion loop ticks.
  * **Result:** All provider drift scores are multiplied by `0.95`, and changes are logged in the audit trail.

* **Case 4: Snapping to Zero**
  * **Trigger:** Provider drift score decays below `0.01`.
  * **Result:** Score is set to exactly `0.00` to prevent trailing fractional values.
