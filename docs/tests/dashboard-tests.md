---
title: dashboard tests
---

# Dashboard & Console View Test Matrix

The Dashboard tests validate telemetry presentation, alert banners, sparklines, and accessibility compliance.

---

## 🖥️ 1. Telemetry Presentation Tests

* **Case 1: Console View Generation**
  * **Input:** execution trace JSON.
  * **Expected:** Derives an `OperatorConsoleView` mapping status, pipeline execution counts, hashes, and certificates.

* **Case 2: SLA Alert Banner**
  * **Input:** active SLA breach in control state.
  * **Expected:** High-visibility banner is rendered at the top of the dashboard displaying the active SEV alert.

---

## ♿ 2. Accessibility & Usability Tests

* **Case 3: Keyboard Focus Navigation**
  * **Input:** Tab keys.
  * **Expected:** Interactive rows and controls receive negative/positive tab index values matching console accessibility contracts.

* **Case 4: Contrast Ratio Verification**
  * **Input:** Playwright visual contrast checks.
  * **Expected:** Contrast levels meet a11y requirements across both dark and light palette modes.
