---
title: "CIC Platform Documentation Tree — Use Case Library"
summary: "Expanded NotebookLM use case library for the CIC platform, covering Research & Synthesis, Project Documentation, Decision Support, Compliance & Audit, and Knowledge Management domains."
created: "2026-07-09"
updated: "2026-07-09"
tags:
  - cic
  - notebooklm
  - use-cases
---

# CIC Platform Documentation Tree — Use Case Library

| Field | Value |
| :--- | :--- |
| **Doc ID** | CIC-UC-001 |
| **Version** | 1.2 |
| **Status** | Draft — Ready for Review |
| **Author** | CIC Integration Team |
| **Date** | 2026-07-09 |
| **Classification** | Internal — Product & Engineering |
| **Cross-References** | CIC-SPEC-MCP-001 ([CoWork MCP Integration Spec](../reference/cowork-mcp-integration-spec.md))<br>CIC-ROAD-001 ([v1.2 Roadmap Addendum](../roadmaps/notebooklm-v12-roadmap-addendum.md))<br>CIC-SPEC-NLM-001 ([NotebookLM Core Spec](notebooklm-integration-plan.md)) |

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Use Case Taxonomy](#2-use-case-taxonomy)
    * 2.1 [Persona Definitions](#21-persona-definitions)
    * 2.2 [Integration Depth Levels](#22-integration-depth-levels)
    * 2.3 [Workflow Domains](#23-workflow-domains)
3. [Use Cases by Domain](#3-use-cases-by-domain)
    * 3.1 [Research & Synthesis](#31-research-synthesis)
        * [UC-RS-001 — Automated Research Briefing](#uc-rs-001--automated-research-briefing)
        * [UC-RS-002 — Comparative Source Analysis](#uc-rs-002--comparative-source-analysis)
        * [UC-RS-003 — Live Research Session with CoWork Activity Context](#uc-rs-003--live-research-session-with-cowork-activity-context)
    * 3.2 [Project Documentation](#32-project-documentation)
        * [UC-PD-001 — Auto-Generated Meeting Summary and Action Items](#uc-pd-001--auto-generated-meeting-summary-and-action-items)
        * [UC-PD-002 — Specification Consistency Check](#uc-pd-002--specification-consistency-check)
        * [UC-PD-003 — Onboarding Knowledge Package](#uc-pd-003--onboarding-knowledge-package)
    * 3.3 [Decision Support](#33-decision-support)
        * [UC-DS-001 — Executive Decision Brief](#uc-ds-001--executive-decision-brief)
        * [UC-DS-002 — Risk and Dependency Surface](#uc-ds-002--risk-and-dependency-surface)
    * 3.4 [Compliance & Audit](#34-compliance-audit)
        * [UC-CA-001 — Policy Compliance Check](#uc-ca-001--policy-compliance-check)
        * [UC-CA-002 — Audit Trail Narrative](#uc-ca-002--audit-trail-narrative)
    * 3.5 [Knowledge Management](#35-knowledge-management)
        * [UC-KM-001 — Living Glossary Maintenance](#uc-km-001--living-glossary-maintenance)
4. [Use Case Coverage Matrix](#4-use-case-coverage-matrix)
5. [Acceptance Criteria Framework](#5-acceptance-criteria-framework)
    * 5.1 [Standard Criteria Categories](#51-standard-criteria-categories)
    * 5.2 [Testing Approach](#52-testing-approach)
    * 5.3 [Sign-Off Requirements](#53-sign-off-requirements)
6. [Open Issues](#6-open-issues)
7. [Document Revision History](#7-document-revision-history)

---

## 1. Purpose and Scope
This document expands the use case library for NotebookLM as deployed within the CIC (Collaborative Intelligence Core) platform, building on the Phase 1–6 integration baseline established in [NotebookLM Core Spec](notebooklm-integration-plan.md). It serves as the primary reference for product, engineering, and compliance teams evaluating, implementing, and validating NotebookLM-powered capabilities across CIC platform workflows.

Use cases defined in this document are organized along three primary dimensions:

* **Persona** — the role or actor initiating or benefiting from the use case
* **Workflow Domain** — the functional area within which the use case operates
* **Integration Depth** — the level of CoWork MCP connectivity required to execute the use case

Each use case entry is structured according to a standard template that includes: a description, trigger conditions, preconditions, step-by-step flow, expected outcomes, integration touchpoints, acceptance criteria, and edge cases. This structured format is intended to support downstream test planning, UAT scenario authoring, and product sign-off.

This document covers all fourteen (14) use cases in the current use case library as of v1.2, spanning six workflow domains. Use cases UC-RS-001 through UC-PD-001 reflect capabilities implemented during the Phase 1–6 baseline. Remaining use cases are planned for delivery in the v1.2 release cycle, as detailed in [v1.2 Roadmap Addendum](../roadmaps/notebooklm-v12-roadmap-addendum.md).

> [!NOTE]
> This document does not cover NotebookLM infrastructure configuration, MCP gateway provisioning, or identity federation setup. Those topics are addressed in [NotebookLM MCP Architecture](../reference/notebooklm-mcp-architecture.md) and [NotebookLM Core Spec](notebooklm-integration-plan.md) respectively.

---

## 2. Use Case Taxonomy
### 2.1 Persona Definitions
The following six personas are defined for use across all use case entries. Each persona represents a distinct role with a characteristic relationship to NotebookLM and the CoWork platform.

| Persona | Role | Primary Goal | NotebookLM Usage Pattern |
| :--- | :--- | :--- | :--- |
| **Knowledge Worker** | Individual contributor; information consumer and producer | Rapidly locate, synthesize, and apply organizational knowledge | Ad-hoc document queries; glossary consultation; onboarding briefs |
| **Project Lead** | Project or workstream owner; coordinates cross-functional delivery | Maintain project clarity, alignment, and documentation quality | Meeting summaries; spec consistency checks; risk registers; onboarding packages |
| **Executive Stakeholder** | Senior decision-maker; limited time, high context requirements | Consume distilled insights to support timely, informed decisions | Decision briefs; risk surfaces; executive summaries of project spaces |
| **Technical Researcher** | Subject-matter expert; drives deep analysis and knowledge creation | Conduct rigorous, multi-source analysis and surface knowledge gaps | Research briefings; comparative analysis; live research sessions; gap identification |
| **Cross-Functional Collaborator** | Operates across multiple teams or workstreams simultaneously | Identify alignment opportunities and surface cross-team knowledge conflicts | Cross-space synthesis; shared notebook sessions; alignment briefs |
| **Compliance Officer** | Responsible for policy adherence and audit readiness | Validate documents against policy; generate audit-ready narratives | Policy compliance checks; audit trail synthesis; gap reports with citations |

### 2.2 Integration Depth Levels
Each use case is assigned one of three integration depth levels that define the degree of CoWork MCP connectivity required for execution. These levels align with the capability tiers defined in [NotebookLM MCP Architecture](../reference/notebooklm-mcp-architecture.md).

| Level | Label | Description | CoWork MCP Dependency |
| :--- | :--- | :--- | :--- |
| **Level 1** | Standalone | NotebookLM operates independently of CoWork MCP. No context injection, no artifact export, no session synchronization. Suitable for isolated document analysis tasks. | None |
| **Level 2** | MCP-Connected | Context injection is active. NotebookLM receives structured context from CoWork Space(s) via the MCP gateway. Artifact export to CoWork Space is supported. Session identity is passed but federation is not required. | Context Injection API; Artifact Export API |
| **Level 3** | Deep Integration | Full real-time synchronization between NotebookLM session and CoWork platform. Includes live activity context injection, real-time artifact export, identity federation, and multi-user collaborative session support. Requires all MCP gateway services to be active. | Context Injection API; Artifact Export API; Activity Feed API; Identity Federation; Session Sync |

### 2.3 Workflow Domains
Use cases are organized into six workflow domains, each representing a distinct functional area of the CIC platform where NotebookLM integration delivers measurable value.

* **Research & Synthesis** — Multi-source analysis, comparative research, and live research session support
* **Project Documentation** — Meeting summaries, specification management, and onboarding content generation
* **Decision Support** — Executive briefings, risk surfaces, and dependency analysis
* **Compliance & Audit** — Policy compliance checking and audit trail narrative generation
* **Knowledge Management** — Glossary maintenance and knowledge gap identification
* **Cross-Team Collaboration** — Cross-space synthesis and shared distributed notebook sessions

---

## 3. Use Cases by Domain

### 3.1 Research & Synthesis

#### UC-RS-001 — Automated Research Briefing
* **Persona:** Technical Researcher
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Research & Synthesis
* **Status:** Implemented (Phase 1–6 Baseline)
* **Trigger:** A researcher uploads five (5) or more source documents to a linked CoWork Space. The upload event fires the `session.created` MCP event, initiating automatic notebook ingestion.

**Description:** NotebookLM ingests the uploaded documents via the Context Injection API. Using the ingested corpus, it generates a structured research briefing that includes: a synthesis of key findings across all sources, a list of conflicting or contradictory claims with source attribution, identified knowledge gaps, and recommended follow-up questions. Upon completion, the briefing is automatically exported to the originating CoWork Space via the Artifact Export API.

**Preconditions:**
* MCP gateway is active and reachable
* CoWork Space has a linked NotebookLM notebook configured
* Source documents are in supported formats: PDF, DOCX, or TXT
* User has write permissions to the CoWork Space

**Steps:**
1. Researcher uploads five or more documents to a CoWork Space
2. CoWork platform fires the `session.created` event to the MCP gateway
3. MCP gateway invokes Context Injection API, passing document references and Space metadata to NotebookLM
4. NotebookLM ingests all documents and constructs an in-session knowledge corpus
5. NotebookLM generates the structured briefing (key findings, conflicting claims, knowledge gaps, follow-up questions)
6. Artifact Export API is called to push the completed briefing document to the CoWork Space
7. CoWork Space delivers a notification to the researcher confirming availability of the briefing
8. Researcher reviews briefing in-Space; no further action required from the platform

**Expected Outcome:** A structured briefing document is available in the originating CoWork Space within 90 seconds of upload completion for document sets up to 10 MB in aggregate. Briefing is correctly attributed with source citations.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* `session.created` event (MCP event bus)

**Acceptance Criteria:**
* Briefing document is present in CoWork Space within 90 seconds of upload completion for qualifying document sets (≤10 MB aggregate)
* Briefing contains at minimum: a key findings section, a conflicting claims section, and a knowledge gaps section
* Each claim in the conflicting claims section is annotated with at least one source citation
* Briefing document is exported in the format specified by the CoWork Space configuration (default: DOCX)
* If document ingestion fails for any individual file, the briefing is generated from successfully ingested files and a failure notice is included

**Edge Cases:**
* **Unsupported file types:** Non-PDF/DOCX/TXT files are skipped; researcher is notified via CoWork Space alert with a list of skipped files
* **Oversized documents:** Documents exceeding the per-file size limit are rejected at ingestion; briefing proceeds on remaining files
* **Partial upload failure:** If fewer than 5 documents are successfully uploaded, the `session.created` event is not fired and briefing generation does not initiate; researcher receives an upload failure summary

---

#### UC-RS-002 — Comparative Source Analysis
* **Persona:** Technical Researcher / Knowledge Worker
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Research & Synthesis
* **Status:** Implemented (Phase 1–6 Baseline)
* **Trigger:** A user submits a comparative question to a notebook that contains two or more source documents (e.g., “How do Sources A and B differ in their approach to X?”).

**Description:** NotebookLM analyzes the query and performs a structured comparative source analysis, surfacing both corroborating evidence (where sources agree) and conflicting evidence (where sources diverge or contradict). Each piece of evidence is annotated with a source citation identifying the originating document and, where possible, the specific passage. Results are rendered as a structured response in the active notebook session and simultaneously exported to a CoWork Space thread via the Artifact Export API, enabling asynchronous team review.

**Preconditions:**
* Notebook contains two or more ingested source documents
* MCP gateway active; CoWork Space linked with notebook
* User is in an active notebook session

**Steps:**
1. User submits a comparative query in the active notebook session
2. NotebookLM identifies relevant passages across all ingested sources
3. NotebookLM classifies evidence as corroborating or conflicting for each sub-topic in the query
4. Annotated comparative analysis is rendered in the notebook session UI
5. Artifact Export API is invoked to post the analysis to the linked CoWork Space thread
6. Team members are notified of the new thread contribution in CoWork

**Expected Outcome:** A structured comparative analysis is rendered in the notebook UI within 30 seconds of query submission. The analysis distinguishes corroborating and conflicting evidence with source citations. A copy is posted to the linked CoWork Space thread.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* CoWork Thread Write API

**Acceptance Criteria:**
* Analysis is returned within 30 seconds for notebooks containing up to 20 source documents
* Every evidence statement is annotated with a source citation (document name and section or page reference)
* Analysis correctly classifies at least 90% of evidence statements as corroborating or conflicting in UAT validation scenarios
* CoWork thread post is created within 10 seconds of analysis completion
* Analysis is formatted as structured text, not raw prose; sections for “Corroborating Evidence” and “Conflicting Evidence” must be present

**Edge Cases:**
* **Single-source notebook:** If only one document is loaded, NotebookLM returns a notice that comparative analysis requires at least two sources
* **Ambiguous query:** NotebookLM prompts the user to clarify the comparison dimensions before proceeding
* **CoWork thread post failure:** Analysis is still returned in the notebook UI; thread post failure is logged and surfaced to the user as a non-blocking warning

---

#### UC-RS-003 — Live Research Session with CoWork Activity Context
* **Persona:** Technical Researcher
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Research & Synthesis
* **Status:** Planned (v1.2)
* **Trigger:** A user opens a notebook session while actively working within a CoWork project workspace. The Activity Feed API detects an active session and begins streaming workspace context.

**Description:** In a Live Research Session, the CoWork Activity Feed (recent document edits, inline comments, linked task updates, and @mentions) is injected into the active notebook session in real time via the Activity Feed API. This enriched context allows NotebookLM to surface prior research artifacts that are directly relevant to current workspace activity, proactively flag contradictions between notebook-indexed sources and new edits detected in the activity feed, and suggest follow-up queries based on emerging project activity. This use case is designed to support researchers working in fast-moving project environments where notebook knowledge must remain synchronized with live team activity.

**Preconditions:**
* Level 3 MCP services active: Activity Feed API, Context Injection API, Identity Federation, Session Sync
* User is authenticated with federated identity across both CoWork and NotebookLM
* Notebook is linked to the active CoWork project workspace
* Activity Feed API is configured to stream events at the workspace level

**Steps:**
1. User opens a notebook session from within an active CoWork project workspace
2. Identity federation confirms user context across both platforms
3. Activity Feed API begins streaming live workspace events to the notebook session context
4. NotebookLM ingests initial activity context and surfaces relevant prior research artifacts
5. As new activity events arrive (edits, comments, tasks), NotebookLM updates its contextual awareness in real time
6. NotebookLM proactively flags any contradictions between live edits and indexed source documents
7. User can query the notebook with questions anchored in current project activity (e.g., “Does the change in §3 of the spec conflict with any prior research?”)
8. Session closes when user exits the CoWork workspace or explicitly ends the notebook session; session state is persisted for resumption

**Expected Outcome:** The notebook session reflects live CoWork workspace context with a maximum activity feed latency of 5 seconds. Contradiction flags are surfaced within 15 seconds of the triggering edit event being detected.

**Integration Touchpoints:**
* Activity Feed API
* Context Injection API
* Identity Federation Service
* Session Sync Service

**Acceptance Criteria:**
* Activity feed context is injected within 5 seconds of workspace event generation
* Contradiction flags are surfaced within 15 seconds of the triggering edit event
* Session persists correctly across short connection interruptions (<30 seconds) without requiring re-authentication
* Identity federation handshake completes within 3 seconds of session initiation
* All live activity context injected into the session is scoped to the user’s permission level in CoWork; no cross-permission data leakage

**Edge Cases:**
* **High-activity workspace:** Activity feed rate-limiting is applied above 50 events/minute; lower-priority events (minor edits) are batched and delivered every 30 seconds
* **Identity federation failure:** Session falls back to Level 2 (MCP-Connected) mode with a user notification; live activity context is suspended until federation is restored
* **Session timeout:** Sessions idle for more than 30 minutes are paused; state is preserved for resumption within 24 hours

---

### 3.2 Project Documentation

#### UC-PD-001 — Auto-Generated Meeting Summary and Action Items
* **Persona:** Project Lead
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Project Documentation
* **Status:** Implemented (Phase 1–6 Baseline)
* **Trigger:** A meeting transcript is uploaded to a CoWork Space by any user with write permissions. The upload fires the `document.added` MCP event, which routes the transcript to the linked notebook.

**Description:** NotebookLM processes the uploaded meeting transcript, extracting structured information including: a concise meeting summary, a list of decisions made (with context), a structured action items list (each with an owner name, due date if stated, and source quote), and a list of open questions or deferred items requiring follow-up. The structured summary is exported to the CoWork task board via the Artifact Export API, with action items auto-populated as draft tasks awaiting owner confirmation.

**Preconditions:**
* MCP gateway active; CoWork Space linked with notebook
* Transcript is in a supported format (TXT, DOCX, or VTT subtitle format)
* CoWork task board integration is enabled for the Space
* Speaker attribution is present in transcript (required for accurate owner assignment)

**Steps:**
1. Project Lead or team member uploads meeting transcript to CoWork Space
2. CoWork fires `document.added` event to MCP gateway
3. MCP gateway invokes Context Injection API to deliver transcript to NotebookLM
4. NotebookLM processes transcript and extracts summary, decisions, action items, and open questions
5. Action items are structured with owner, due date (if stated), and source quote
6. Artifact Export API delivers the structured summary to CoWork Space as a new document
7. Action items are submitted to CoWork task board as draft tasks with extracted metadata
8. Project Lead receives notification to review and confirm draft tasks before they go live

**Expected Outcome:** Structured meeting summary and draft task list are available in CoWork Space within 60 seconds of transcript upload for transcripts up to 50,000 words. Action item tasks are correctly attributed to named owners where speaker attribution exists in the transcript.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* CoWork Task Board API
* `document.added` event (MCP event bus)

**Acceptance Criteria:**
* Summary and draft task list are available in CoWork Space within 60 seconds for transcripts ≤50,000 words
* All explicitly stated action items in the transcript are captured (recall ≥95% in UAT scenarios)
* Each action item includes: description, owner (if attributable), due date (if stated), and source quote
* Draft tasks require explicit Project Lead confirmation before becoming active tasks on the board
* Open questions section is present and non-empty when unresolved questions are detected in the transcript

**Edge Cases:**
* **No speaker attribution:** Action items are extracted but owner field is left blank; Project Lead is prompted to assign owners during review
* **Non-meeting transcript:** If the document is not detected as a meeting transcript, NotebookLM returns a classification notice and does not generate action items
* **Task board unavailable:** Summary document is still exported to CoWork Space; action items are included in the document body rather than pushed to the task board; retry is attempted when task board service is restored

---

#### UC-PD-002 — Specification Consistency Check
* **Persona:** Project Lead / Technical Researcher
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Project Documentation
* **Status:** Planned (v1.2)
* **Trigger:** A new specification document is added to a CoWork Space that contains one or more linked notebooks indexed with the CIC documentation tree (e.g., CIC-SPEC-MCP-001, CIC-ROAD-001).

**Description:** NotebookLM performs a specification consistency check by cross-referencing the newly added document against the full indexed CIC documentation tree. The check identifies: direct contradictions with existing specifications, missing or broken cross-references, terminology drift (use of terms inconsistently with established definitions), and sections lacking required citations. The output is a structured consistency report exported to the CoWork Space, with each finding annotated by the conflicting source document and clause reference.

**Preconditions:**
* Level 3 MCP services active
* CIC documentation tree is fully indexed in the linked notebook
* New specification document is in a supported format
* Cross-reference index is current (last updated within 24 hours)

**Steps:**
1. User adds new specification document to CoWork Space
2. `document.added` event fires; MCP gateway routes document to NotebookLM via Context Injection API
3. NotebookLM parses the new document and extracts all claims, definitions, and cross-references
4. NotebookLM compares extracted content against indexed documentation tree
5. Contradictions, missing cross-references, and terminology drift are identified and classified by severity (Critical, Major, Minor)
6. Consistency report is structured with findings organized by severity
7. Artifact Export API delivers the consistency report to CoWork Space as a linked document
8. Project Lead is notified with a summary of Critical and Major findings

**Expected Outcome:** A structured consistency report is available in CoWork Space within 120 seconds of document addition for specification documents up to 50 pages. Critical findings are surfaced in a notification to the Project Lead.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* Activity Feed API
* Cross-reference index service

**Acceptance Criteria:**
* Consistency report is delivered within 120 seconds for documents ≤50 pages
* All direct contradictions with Core specs and Roadmaps are flagged as Critical severity
* Each finding includes: finding type, severity, affected clause in new document, conflicting source document and clause
* Terminology drift detection achieves ≥85% precision in UAT scenarios using the established glossary
* Consistency report cross-reference accuracy is validated against manual review in at least 3 UAT specification documents

**Edge Cases:**
* **Documentation tree not fully indexed:** Check proceeds with available indexed documents; report includes a caveat listing documents not included in the check
* **New document introduces new terminology:** New terms are flagged for addition to the living glossary rather than flagged as inconsistencies
* **Stale cross-reference index:** If index is older than 24 hours, check is blocked and user is notified; manual re-index can be triggered by Project Lead

---

#### UC-PD-003 — Onboarding Knowledge Package
* **Persona:** Knowledge Worker (new team member)
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Project Documentation
* **Status:** Planned (v1.2)
* **Trigger:** A new user is added to a CoWork Space. The `user.added` MCP event fires, initiating automatic onboarding package generation.

**Description:** NotebookLM generates a curated onboarding knowledge package tailored to the CoWork Space into which the new user has been added. The package is assembled from the Space’s linked notebook content and includes: a summary of the team’s mission and current project state, a list of key documents with one-sentence descriptions, a digest of recent decisions and their rationale, the team’s active glossary, and a list of currently open questions requiring attention. The package is delivered to the new user’s CoWork inbox as a formatted document.

**Preconditions:**
* MCP gateway active; CoWork Space linked with notebook
* Notebook contains sufficient indexed content (at minimum: 3 documents, 30 days of activity)
* New user has been granted appropriate CoWork Space access permissions
* CoWork inbox API is operational

**Steps:**
1. Administrator adds new user to CoWork Space
2. `user.added` event fires to MCP gateway
3. MCP gateway invokes Context Injection API to provide NotebookLM with Space metadata, recent activity, and indexed documents
4. NotebookLM synthesizes the onboarding package content from Space context
5. Package is structured into defined sections: Mission & State, Key Documents, Recent Decisions, Glossary, Open Questions
6. Artifact Export API delivers the package to the new user’s CoWork inbox
7. New user receives an inbox notification prompting them to review the package

**Expected Outcome:** Onboarding package is delivered to the new user’s CoWork inbox within 3 minutes of the `user.added` event. Package reflects current Space content at time of generation.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* CoWork Inbox API
* `user.added` event (MCP event bus)

**Acceptance Criteria:**
* Package is delivered to new user’s CoWork inbox within 3 minutes of `user.added` event
* Package contains all five required sections: Mission & State, Key Documents, Recent Decisions, Glossary, Open Questions
* Key Documents section includes at least the 5 most recently active documents in the Space
* Glossary content is sourced from the most recently generated glossary artifact if available
* Package content is scoped to documents and activity visible to the new user’s permission level

**Edge Cases:**
* **Sparse Space (fewer than 3 documents):** Package is generated with available content; a notice is included that the Space is newly established and content may be limited
* **Inbox delivery failure:** Package is placed in a Space-level holding folder; user is notified via CoWork notification center with a direct link
* **User removed before delivery completes:** Generation is cancelled and the partially generated package is discarded

---

### 3.3 Decision Support

#### UC-DS-001 — Executive Decision Brief
* **Persona:** Executive Stakeholder
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Decision Support
* **Status:** Planned (v1.2)
* **Trigger:** An Executive Stakeholder explicitly requests a summary of a CoWork Space prior to a scheduled decision meeting. Request is submitted via the NotebookLM interface or a CoWork Space command.

**Description:** NotebookLM generates a concise, single-page executive decision brief synthesized from the linked CoWork Space content. The brief is structured for a non-technical audience and contains the following fixed sections: Context (what problem or opportunity is being addressed), Options Considered (the alternatives evaluated, as documented in the Space), Recommendation (the preferred option and rationale, as documented), Risks (key risks associated with the recommendation), and Open Dependencies (unresolved items that may impact implementation). The brief is limited to approximately one printed page and uses plain language throughout.

**Preconditions:**
* MCP gateway active; CoWork Space linked with notebook
* Space contains sufficient decision-relevant content (documents, threads, decisions log)
* Executive Stakeholder has at minimum read access to the CoWork Space

**Steps:**
1. Executive Stakeholder submits a brief request for the linked CoWork Space
2. MCP gateway invokes Context Injection API to deliver current Space content to NotebookLM
3. NotebookLM identifies decision-relevant content: documented options, decisions, risk items, and dependencies
4. NotebookLM generates the one-page brief in plain language, structuring content into the five fixed sections
5. Brief is exported to the CoWork Space and delivered directly to the Executive Stakeholder’s CoWork inbox
6. Executive Stakeholder reviews the brief pre-meeting; no further platform action is required

**Expected Outcome:** A structured one-page decision brief is delivered to the Executive Stakeholder’s CoWork inbox within 60 seconds of request submission. Brief does not exceed 600 words and avoids unexplained technical jargon.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* CoWork Inbox API

**Acceptance Criteria:**
* Brief is delivered within 60 seconds of request submission
* Brief contains all five required sections: Context, Options Considered, Recommendation, Risks, Open Dependencies
* Brief does not exceed 600 words in total
* No unexplained technical jargon is present; technical terms are defined inline if used
* In UAT review, Executive Stakeholder personas rate the brief as “sufficient for decision preparation” in ≥80% of test scenarios

**Edge Cases:**
* **Insufficient decision content in Space:** Brief is generated with available content; a notice is included indicating that the recommendation and options sections may be incomplete due to limited documented decisions
* **Multiple competing recommendations documented:** All are listed under Options Considered; no single recommendation is asserted without clear source attribution
* **Executive Stakeholder lacks Space access:** Request is rejected with an access notice; Space administrator is notified

---

#### UC-DS-002 — Risk and Dependency Surface
* **Persona:** Project Lead / Executive Stakeholder
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Decision Support
* **Status:** Planned (v1.2)
* **Trigger:** A user queries the notebook with the phrase “surface risks and dependencies” (or a semantically equivalent query) while in a session linked to a project CoWork Space.

**Description:** NotebookLM analyzes the full content of linked CoWork Space documents and the real-time activity feed to identify both stated risks (explicitly documented in project artifacts) and implied risks (inferred from patterns in activity data, unresolved comments, approaching deadlines, and incomplete tasks). External dependencies and deadline conflicts are likewise identified. The output is a structured risk register exported to the CoWork Space, with each entry classified by risk type, severity, and source evidence.

**Preconditions:**
* Level 3 MCP services active; Activity Feed API streaming for the linked Space
* User is authenticated with federated identity
* CoWork Space contains task board data accessible to the notebook via MCP

**Steps:**
1. User submits a risk and dependency surface query to the notebook
2. Activity Feed API delivers current workspace state: active tasks, approaching deadlines, unresolved comments
3. NotebookLM scans all indexed documents for explicitly stated risks and dependency references
4. NotebookLM cross-references activity data to identify implied risks not explicitly documented
5. Risk register is structured with: Risk ID, Type (Stated / Implied), Severity (High / Medium / Low), Description, Source Evidence, and Suggested Owner
6. Dependency conflicts and deadline clashes are listed as a separate register section
7. Artifact Export API delivers the risk register to CoWork Space
8. Project Lead and Executive Stakeholder (if linked) receive notification of new risk register

**Expected Outcome:** A structured risk register is available in CoWork Space within 90 seconds of query submission. Register distinguishes stated from implied risks and identifies at least all deadline conflicts present in the task board.

**Integration Touchpoints:**
* Activity Feed API
* Context Injection API
* Artifact Export API
* CoWork Task Board API
* Identity Federation Service

**Acceptance Criteria:**
* Risk register is delivered within 90 seconds of query submission
* All explicitly stated risks in indexed documents are captured (recall ≥90% in UAT scenarios)
* All task board deadline conflicts present at the time of query are included in the register
* Each risk entry includes: type, severity, description, and source evidence reference
* Implied risks are clearly labelled as inferred and include the activity evidence that triggered the inference

**Edge Cases:**
* **No risks found:** Register is delivered with a “No risks identified” summary; query timestamp is recorded for audit
* **Activity Feed unavailable:** Risk surface proceeds on indexed documents only; register includes a notice that live activity context was unavailable and implied risk identification may be incomplete
* **Large Space with many tasks:** Task board query is limited to tasks with due dates within 90 days; tasks outside this window are flagged as out-of-scope with a note

---

### 3.4 Compliance & Audit

#### UC-CA-001 — Policy Compliance Check
* **Persona:** Compliance Officer
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Compliance & Audit
* **Status:** Planned (v1.2)
* **Trigger:** A document is submitted for compliance review in a CoWork Space designated as a compliance review queue. The `document.submitted_for_review` event fires to the MCP gateway.

**Description:** NotebookLM checks the submitted document against one or more policy notebooks linked to the compliance review CoWork Space. The check identifies: clauses or sections that are non-compliant with linked policy documents, required disclosures or language that is absent, and terminology that deviates from policy-mandated phrasing. The output is a structured compliance gap report with each finding annotated by: the non-compliant clause in the submitted document, the policy source and specific policy clause being violated, and a suggested remediation. PII handling during this use case is governed by Core requirements; no PII from submitted documents is retained in the notebook beyond the active session.

**Preconditions:**
* MCP gateway active; compliance review CoWork Space linked to policy notebook(s)
* Policy notebooks are current and indexed
* Submitting user has compliance submission permissions in the CoWork Space
* PII handling configuration is set per privacy mandates (no PII retention)

**Steps:**
1. User submits document to compliance review queue in CoWork Space
2. `document.submitted_for_review` event fires to MCP gateway
3. MCP gateway invokes Context Injection API to deliver document to NotebookLM alongside linked policy notebooks
4. NotebookLM parses the submitted document and identifies all reviewable clauses
5. Each clause is checked against the policy notebook corpus; findings are classified as Non-Compliant, Advisory, or Compliant
6. Compliance gap report is structured with findings ordered by severity
7. Artifact Export API delivers the compliance gap report to the CoWork Space compliance review thread
8. Compliance Officer receives notification with a summary count of Non-Compliant findings

**Expected Outcome:** Compliance gap report is available in the CoWork Space compliance review thread within 90 seconds of document submission for documents up to 30 pages. All Non-Compliant findings include a policy citation.

**Integration Touchpoints:**
* Context Injection API
* Artifact Export API
* PII Handling Service
* `document.submitted_for_review` event (MCP event bus)

**Acceptance Criteria:**
* Compliance gap report is delivered within 90 seconds for documents ≤30 pages
* All Non-Compliant findings include a citation to the specific policy clause violated
* No PII from the submitted document is retained in notebook storage after session close
* False positive rate for Non-Compliant findings is ≤10% in UAT scenarios validated against manual expert review
* Report is delivered in a format that supports export to PDF for formal compliance records

**Edge Cases:**
* **Policy notebook outdated (older than 30 days without update):** Report is generated with a prominent notice that policy content may be stale; Compliance Officer is prompted to update policy notebooks
* **Document contains PII:** PII fields are detected, redacted from the working context, and flagged in the report for manual Compliance Officer review
* **Document in unsupported language:** Submission is rejected; Compliance Officer is notified that the document requires manual review

---

#### UC-CA-002 — Audit Trail Narrative
* **Persona:** Compliance Officer
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Compliance & Audit
* **Status:** Planned (v1.2)
* **Trigger:** An audit request is initiated in a CoWork Space by a Compliance Officer or Space administrator. The `audit.requested` MCP event fires with a specified date range and scope.

**Description:** NotebookLM synthesizes a comprehensive audit trail narrative from two primary sources: CoWork activity logs (accessed via the Activity Feed API for the specified date range and scope) and linked indexed documents. The output is a chronological narrative timeline that describes: key decisions made and when, document changes and the actors responsible, approvals granted and by whom, and any anomalies or gaps in the activity record. The narrative is structured to meet the needs of both internal audit reviews and potential external regulatory examination.

**Preconditions:**
* Level 3 MCP services active; Activity Feed API capable of historical log retrieval
* Compliance Officer has audit access permissions in the CoWork Space
* Activity logs for the requested date range are available and intact
* Identity federation active for accurate actor attribution

**Steps:**
1. Compliance Officer initiates audit request in CoWork Space with specified date range and scope
2. `audit.requested` event fires to MCP gateway with request parameters
3. Activity Feed API retrieves historical activity logs for the specified scope and date range
4. MCP gateway delivers logs and linked documents to NotebookLM via Context Injection API
5. NotebookLM constructs chronological event sequence from activity logs
6. Narrative is enriched with document context: referenced decisions, approval records, and change rationale from indexed documents
7. Audit gaps (missing activity records, unexplained changes) are identified and flagged
8. Artifact Export API delivers the completed audit trail narrative to the CoWork Space as a versioned, read-only document
9. Compliance Officer receives delivery notification with document link

**Expected Outcome:** A complete audit trail narrative covering the specified date range and scope is delivered as a versioned read-only document in CoWork Space. All actor attributions are confirmed via identity federation records.

**Integration Touchpoints:**
* Activity Feed API — historical retrieval mode
* Context Injection API
* Artifact Export API
* Identity Federation Service

**Acceptance Criteria:**
* Audit trail narrative covers all activity within the specified date range with no unexplained chronological gaps
* All actor attributions are confirmed against identity federation records; unconfirmed attributions are flagged
* Audit gaps are explicitly identified and described in a dedicated section of the narrative
* Delivered document is read-only and versioned; modification is not permitted after delivery
* Narrative generation completes within 5 minutes for audit scopes covering up to 90 days of activity

**Edge Cases:**
* **Activity log gaps:** Gaps are identified and flagged as “Activity Record Unavailable” for the affected time range; narrative continues from next available record
* **Identity federation cannot confirm an actor:** Actor is recorded as “Unverified Actor—[User ID]” and flagged for manual Compliance Officer review
* **Audit scope exceeds 90 days:** Compliance Officer is warned of extended generation time; request is queued and notification is sent upon completion

---

### 3.5 Knowledge Management

#### UC-KM-001 — Living Glossary Maintenance
* **Persona:** Knowledge Worker / Project Lead
* **Integration Depth:** Level 2 (MCP-Connected)
* **Workflow Domain:** Knowledge Management
* **Status:** Planned (v1.2)
* **Trigger:** A weekly scheduled job fires the `glossary.maintenance_scheduled` event for each CoWork Space configured for living glossary maintenance. Job schedule is configurable per Space (default: Monday 08:00 local Space timezone).

**Description:** NotebookLM scans all new documents added to linked CoWork Spaces since the last maintenance run, extracts candidate new terms and definitions, and compares them against the existing glossary notebook for the Space. For each candidate term, NotebookLM determines whether it is: a new term to be added, a variant or alias of an existing term, a redefinition of an existing term (flagged for human review), or a term already present (no action required). A glossary update proposal is generated and delivered to the Space for human review and approval. No updates are committed to the glossary without explicit human approval.

**Preconditions:**
* MCP gateway active; CoWork Space configured for glossary maintenance
* Glossary notebook exists and is indexed for the Space
* At least one new document has been added to the Space since the last maintenance run
* Designated glossary reviewer (Knowledge Worker or Project Lead) is assigned to the Space

**Steps:**
1. Scheduled job fires `glossary.maintenance_scheduled` event
2. Context Injection API delivers all new documents (since last run) and current glossary content to NotebookLM
3. NotebookLM scans new documents for candidate terms using definition-pattern recognition
4. Each candidate term is compared against the current glossary
5. Terms are classified: New, Variant/Alias, Redefinition (conflict), Already Present
6. Glossary update proposal is generated listing all New and Variant terms, and flagging all Redefinitions
7. Artifact Export API delivers the proposal to the CoWork Space for reviewer action
8. Designated reviewer approves, modifies, or rejects each proposed change; approved changes are committed to the glossary notebook

**Expected Outcome:** A glossary update proposal is available in CoWork Space within 3 minutes of the scheduled trigger. No glossary changes are committed without human approval. Redefinition conflicts are clearly flagged for resolution. Proposal includes a “no new terms found” summary when no candidates are identified, confirming the scan ran successfully.

**Integration Touchpoints:**
* Context Injection API (CIC-SPEC-MCP-001 §4.2)
* Artifact Export API (CIC-SPEC-MCP-001 §4.4)
* Scheduled Job Service (MCP event bus)

**Acceptance Criteria:**
* Glossary update proposal is delivered within 3 minutes of scheduled trigger
* All newly introduced terms in scanned documents are identified with ≥80% recall in UAT scenarios
* Redefinition conflicts are flagged with both the existing definition and the proposed new definition presented side-by-side
* No changes are committed to the glossary notebook without explicit reviewer approval action

**Edge Cases:**
* **No new documents since last run:** Scan is skipped; a brief maintenance log entry is posted to the Space confirming no action was required
* **Glossary notebook missing or corrupt:** Maintenance run is aborted; Space administrator is notified to restore or re-create the glossary notebook
* **Reviewer does not act within 7 days:** Proposal is re-surfaced with an escalation notice to the Space administrator

---

#### UC-KM-002 — Knowledge Gap Identification
* **Persona:** Technical Researcher / Project Lead
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Knowledge Management
* **Status:** Planned (v1.2)
* **Trigger:** A user submits a strategic question to a notebook linked to a CoWork Space (e.g., “What do we know about X, and where are our gaps?”).

**Description:** NotebookLM evaluates the strategic question against the full indexed knowledge corpus of the linked CoWork Space(s). It identifies knowledge gaps—sub-topics or dimensions of the question for which the corpus contains insufficient, contradictory, or absent source coverage. For each gap, NotebookLM assesses the likely impact on the user’s strategic question and generates a prioritized research agenda: an ordered list of knowledge gaps with recommended research actions, suggested source types, and an estimated effort classification (Low / Medium / High). The agenda is exported to the CoWork Space for team planning.

**Preconditions:**
* Level 3 MCP services active
* Notebook has sufficient indexed content to evaluate coverage (minimum: 5 documents)
* User is authenticated with federated identity
* CoWork Space is linked and accessible via MCP

**Steps:**
1. User submits strategic question to notebook session
2. NotebookLM decomposes the question into sub-topics and coverage dimensions
3. Each sub-topic is evaluated against the indexed corpus for coverage adequacy
4. Activity Feed API delivers recent workspace context to enrich gap analysis with current project activity
5. Gaps are classified by type: Absent (no coverage), Insufficient (thin coverage), Contradictory (conflicting sources)
6. Each gap is assessed for impact on the strategic question and assigned a priority rank
7. Prioritized research agenda is structured with: Gap ID, Type, Priority, Description, Recommended Action, Suggested Source Types, Estimated Effort
8. Artifact Export API delivers agenda to CoWork Space

**Expected Outcome:** A prioritized research agenda is available in CoWork Space within 60 seconds of query submission. Agenda covers all major sub-topics of the strategic question and clearly distinguishes gap types.

**Integration Touchpoints:**
* Activity Feed API (CIC-SPEC-MCP-001 §4.5)
* Context Injection API (CIC-SPEC-MCP-001 §4.2)
* Artifact Export API (CIC-SPEC-MCP-001 §4.4)
* Identity Federation Service (CIC-SPEC-MCP-001 §6.1)

**Acceptance Criteria:**
* Research agenda is delivered within 60 seconds of query submission
* Agenda covers all major sub-topics derivable from the strategic question
* Each gap entry includes type, priority, description, and at least one recommended action
* Corpus coverage assessment is consistent with manual expert review in ≥75% of UAT scenarios
* Agenda is formatted for direct use in sprint planning or research prioritization sessions

**Edge Cases:**
* **Corpus has full coverage of the question:** Agenda is returned as empty with a “No significant gaps identified” confirmation and a coverage summary
* **Overly broad strategic question:** NotebookLM prompts user to narrow the question scope before proceeding, or offers to analyze the top 3 most prominent sub-topics
* **Contradictory sources on a sub-topic:** Gap is classified as “Contradictory” and both conflicting sources are cited; recommended action includes source reconciliation

---

### 3.6 Cross-Team Collaboration

#### UC-CC-001 — Cross-Space Knowledge Synthesis
* **Persona:** Cross-Functional Collaborator
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Cross-Team Collaboration
* **Status:** Planned (v1.2)
* **Trigger:** A user links two or more CoWork Spaces within a single notebook session. The session.spaces_linked MCP event fires upon the second (and each subsequent) Space being linked.

**Description:** NotebookLM synthesizes content across all linked CoWork Spaces simultaneously, providing the Cross-Functional Collaborator with a unified knowledge view spanning multiple teams or workstreams. The synthesis surfaces: common themes present across spaces, conflicting approaches to shared problem areas, and integration opportunities where work in one space is directly relevant to another. The output is a cross-team alignment brief exported to a designated synthesis Space or directly to the user’s CoWork inbox, structured to facilitate a cross-team alignment meeting.

**Preconditions:**
* Level 3 MCP services active
* User has read access to all linked CoWork Spaces
* Each linked Space has a configured notebook with indexed content
* Identity federation confirms user cross-Space access

**Steps:**
1. User links a second (or additional) CoWork Space to the active notebook session
2. session.spaces_linked event fires; MCP gateway initiates multi-space context injection
3. Context Injection API delivers indexed content from all linked Spaces to the notebook session
4. NotebookLM identifies common themes by comparing key topics and terminology across spaces
5. NotebookLM identifies conflicting approaches where spaces address the same problem differently
6. NotebookLM identifies integration opportunities where one space’s work directly impacts or could benefit another
7. Cross-team alignment brief is structured with three sections: Common Themes, Conflicting Approaches, Integration Opportunities
8. Artifact Export API delivers the brief to a designated synthesis Space or user’s CoWork inbox

**Expected Outcome:** A cross-team alignment brief covering all three required sections is available within 90 seconds of all Spaces being linked for sessions spanning up to 4 CoWork Spaces.

**Integration Touchpoints:**
* Context Injection API — multi-space mode (CIC-SPEC-MCP-001 §4.2)
* Activity Feed API (CIC-SPEC-MCP-001 §4.5)
* Artifact Export API (CIC-SPEC-MCP-001 §4.4)
* Identity Federation Service (CIC-SPEC-MCP-001 §6.1)
* session.spaces_linked event (MCP event bus)

**Acceptance Criteria:**
* Alignment brief is delivered within 90 seconds for sessions spanning up to 4 CoWork Spaces
* Brief contains all three required sections: Common Themes, Conflicting Approaches, Integration Opportunities
* Content from each linked Space is represented in the synthesis; no Space is silently omitted
* User access permissions for each Space are enforced; content from Spaces the user cannot access is not included even if technically reachable
* In UAT cross-functional scenarios, alignment brief surfaces at least one substantive integration opportunity not previously identified by the team

**Edge Cases:**
* **User lacks access to one of the linked Spaces:** That Space is excluded from synthesis; brief includes a notice indicating which Space(s) were excluded due to access restrictions
* **Spaces have no thematic overlap:** Brief is delivered with a “No common themes identified” notice; Integration Opportunities section may still surface handoff points between workstreams
* **More than 4 Spaces linked:** User is warned that synthesis quality may degrade; session proceeds with all Spaces but latency SLA is not guaranteed beyond 4 Spaces

---

#### UC-CC-002 — Shared Notebook Session for Distributed Teams
* **Persona:** Cross-Functional Collaborator / Project Lead
* **Integration Depth:** Level 3 (Deep Integration)
* **Workflow Domain:** Cross-Team Collaboration
* **Status:** Planned (v1.2)
* **Trigger:** A session host creates a shared notebook session and invites participants from one or more CoWork Spaces. Each invited participant who joins the session triggers the session.participant_joined event.

**Description:** In a Shared Notebook Session, multiple users from different CoWork Spaces collaborate within a single NotebookLM session simultaneously. As each participant joins, real-time MCP context injection delivers that participant’s active CoWork workspace context (recent activity, linked documents, current tasks) into the shared session environment. NotebookLM acts as a collaborative AI moderator: surfacing context from each participant’s workspace that is relevant to the current discussion, flagging contradictions between workspace states in real time, and tracking questions and decisions emerging from the session for export as a shared artifact. Concurrent session limits are governed by CIC-SPEC-MCP-001 §2.3.

**Preconditions:**
* Level 3 MCP services active for all participants
* All participants are authenticated with federated identity
* Concurrent session limit (per CIC-SPEC-MCP-001 §2.3) is not exceeded
* Session host has permission to create shared notebook sessions

**Steps:**
1. Session host creates a shared notebook session and distributes session invitations via CoWork
2. Each participant accepts invitation and joins the session; session.participant_joined event fires per participant
3. Upon joining, each participant’s active CoWork workspace context is injected into the shared session via Context Injection API
4. NotebookLM synthesizes all participant workspace contexts into a unified session view
5. During the session, participants submit questions and prompts; NotebookLM responds with context drawn from the relevant participant workspaces
6. NotebookLM surfaces contradictions between workspace states and flags them for group discussion
7. NotebookLM tracks session decisions and questions in a running session log
8. Upon session close, a session summary artifact (decisions, questions, contradictions flagged) is exported to each participant’s CoWork Space

**Expected Outcome:** All participants experience a coherent shared session with workspace context injected within 5 seconds of joining. Session summary is exported to all participant Spaces within 60 seconds of session close.

**Integration Touchpoints:**
* Context Injection API — multi-user mode (CIC-SPEC-MCP-001 §4.2)
* Activity Feed API (CIC-SPEC-MCP-001 §4.5)
* Artifact Export API — multi-destination mode (CIC-SPEC-MCP-001 §4.4)
* Identity Federation Service (CIC-SPEC-MCP-001 §6.1)
* Session Sync Service — concurrent session management (CIC-SPEC-MCP-001 §2.3)
* session.participant_joined event (MCP event bus)

**Acceptance Criteria:**
* Workspace context for each joining participant is injected within 5 seconds of session.participant_joined event
* Concurrent session participant limit (CIC-SPEC-MCP-001 §2.3) is enforced; attempts to exceed the limit are rejected with a clear notification to the session host
* Contradiction flags are surfaced within 15 seconds of the triggering context conflict being detected
* Session summary artifact is exported to all participant CoWork Spaces within 60 seconds of session close
* Each participant’s workspace context is scoped to their own permissions; no cross-participant data leakage is permitted

**Edge Cases:**
* **Participant drops from session:** Their workspace context is retained in the session for the duration but is flagged as “participant disconnected”; session continues for remaining participants
* **Concurrent session limit reached:** New join attempts are queued and the session host is notified; queued participants receive an estimated wait time
* **Session summary export fails for one or more Spaces:** Export is retried up to 3 times; on persistent failure, the session host receives the full summary for manual distribution

---

## 4. Use Case Coverage Matrix

The table below provides a consolidated view of all twelve use cases defined in this document, organized by ID. MCP APIs Used references section numbers from CIC-SPEC-MCP-001. Status reflects implementation state as of document version 1.2.

| Use Case ID | Title | Persona | Domain | Integration Depth | MCP APIs Used | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-RS-001** | Automated Research Briefing | Technical Researcher | Research & Synthesis | Level 2 | Context Injection §4.2; Artifact Export §4.4 | Implemented (Phase 1–6) |
| **UC-RS-002** | Comparative Source Analysis | Technical Researcher / Knowledge Worker | Research & Synthesis | Level 2 | Context Injection §4.2; Artifact Export §4.4; Thread Write API | Implemented (Phase 1–6) |
| **UC-RS-003** | Live Research Session with CoWork Activity Context | Technical Researcher | Research & Synthesis | Level 3 | Activity Feed §4.5; Context Injection §4.2; Identity Federation §6.1; Session Sync §2.3 | Planned (v1.2) |
| **UC-PD-001** | Auto-Generated Meeting Summary and Action Items | Project Lead | Project Documentation | Level 2 | Context Injection §4.2; Artifact Export §4.4; Task Board API | Implemented (Phase 1–6) |
| **UC-PD-002** | Specification Consistency Check | Project Lead / Technical Researcher | Project Documentation | Level 3 | Context Injection §4.2; Artifact Export §4.4; Activity Feed §4.5 | Planned (v1.2) |
| **UC-PD-003** | Onboarding Knowledge Package | Knowledge Worker | Project Documentation | Level 2 | Context Injection §4.2; Artifact Export §4.4; Inbox API | Planned (v1.2) |
| **UC-DS-001** | Executive Decision Brief | Executive Stakeholder | Decision Support | Level 2 | Context Injection §4.2; Artifact Export §4.4; Inbox API | Planned (v1.2) |
| **UC-DS-002** | Risk and Dependency Surface | Project Lead / Executive Stakeholder | Decision Support | Level 3 | Activity Feed §4.5; Context Injection §4.2; Artifact Export §4.4; Task Board API; Identity Federation §6.1 | Planned (v1.2) |
| **UC-CA-001** | Policy Compliance Check | Compliance Officer | Compliance & Audit | Level 2 | Context Injection §4.2; Artifact Export §4.4; PII Handling §8.4 | Planned (v1.2) |
| **UC-CA-002** | Audit Trail Narrative | Compliance Officer | Compliance & Audit | Level 3 | Activity Feed §4.5 (historical); Context Injection §4.2; Artifact Export §4.4; Identity Federation §6.1 | Planned (v1.2) |
| **UC-KM-001** | Living Glossary Maintenance | Knowledge Worker / Project Lead | Knowledge Management | Level 2 | Context Injection §4.2; Artifact Export §4.4; Scheduled Job Service | Planned (v1.2) |
| **UC-KM-002** | Knowledge Gap Identification | Technical Researcher / Project Lead | Knowledge Management | Level 3 | Activity Feed §4.5; Context Injection §4.2; Artifact Export §4.4; Identity Federation §6.1 | Planned (v1.2) |
| **UC-CC-001** | Cross-Space Knowledge Synthesis | Cross-Functional Collaborator | Cross-Team Collaboration | Level 3 | Context Injection §4.2 (multi-space); Activity Feed §4.5; Artifact Export §4.4; Identity Federation §6.1 | Planned (v1.2) |
| **UC-CC-002** | Shared Notebook Session for Distributed Teams | Cross-Functional Collaborator / Project Lead | Cross-Team Collaboration | Level 3 | Context Injection §4.2 (multi-user); Activity Feed §4.5; Artifact Export §4.4; Identity Federation §6.1; Session Sync §2.3 | Planned (v1.2) |

> [!NOTE]
> **Coverage Note**  
> Use cases UC-RS-001, UC-RS-002, UC-RS-003, and UC-PD-001 represent the Phase 1–6 implementation baseline. All remaining use cases are targeted for the v1.2 release cycle. Refer to [v1.2 Roadmap Addendum](../roadmaps/notebooklm-v12-roadmap-addendum.md) for delivery milestones and prioritization.

---

## 5. Acceptance Criteria Framework

### 5.1 Standard Criteria Categories
All use cases in this document are validated against the following five standard acceptance criteria categories. Individual use case acceptance criteria are composed from these categories and extended with use-case-specific requirements.

| Category | Description | Example Criteria |
| :--- | :--- | :--- |
| **Functional Correctness** | The output meets the functional specification: required sections are present, content is accurate relative to source documents, and classifications (e.g., risk severity, gap type) are correct. | Recall ≥90% for action item extraction; all Non-Compliant findings include policy citations |
| **Latency Compliance** | The use case completes within the defined time-to-completion SLA for the specified input scale (document count, word count, participant count). | Briefing delivered within 90 seconds; session context injected within 5 seconds of participant join |
| **Format Compliance** | Exported artifacts conform to the format required by the receiving system (CoWork Space, task board, inbox) and the document type specification in CIC-SPEC-NLM-001. | Artifact exported as DOCX by default; compliance reports exportable to PDF |
| **Error Handling** | The use case degrades gracefully under failure conditions: partial failures produce partial outputs with clear notices; full failures produce actionable error messages; no silent failures occur. | Unsupported file types skipped with user notification; fallback to Level 2 on federation failure |
| **Security — PII & Audit Log** | PII from submitted documents is handled per CIC-SPEC-MCP-001 §8.4 (no retention beyond active session). All use case executions generate an audit log entry including: timestamp, user identity, input references, and output artifact references. | No PII retained after session close; audit log entry present for every use case execution |

### 5.2 Testing Approach
Each use case is validated through a four-tier testing approach aligned to the categories above:

* **Unit Testing:** Individual MCP API calls, event handlers, and NotebookLM prompt templates are tested in isolation. Covers: correct event payloads, API parameter validation, and error response handling.
* **Integration Testing:** End-to-end flow from trigger event through output artifact delivery is tested in a staging environment with simulated CoWork Space data. Covers: API chaining, context injection accuracy, and artifact export format compliance.
* **End-to-End Testing:** Full use case flows are executed against a production-equivalent environment with realistic document corpora. Latency SLAs are validated under representative load conditions. Edge cases are exercised using scripted test scenarios.
* **User Acceptance Testing (UAT):** Persona-based test scenarios are executed by representatives of each named persona (Technical Researcher, Project Lead, Executive Stakeholder, Knowledge Worker, Cross-Functional Collaborator, Compliance Officer). UAT scenarios are designed to validate functional correctness and qualitative outcome quality. UAT sign-off is required before use case status can be updated from “Planned” to “Implemented.”

### 5.3 Sign-Off Requirements
Use case acceptance requires sign-off from the following roles, depending on domain:

| Domain | Use Cases | Required Sign-Off |
| :--- | :--- | :--- |
| **Research & Synthesis, Project Documentation, Decision Support, Knowledge Management, Cross-Team Collaboration** | UC-RS-\*, UC-PD-\*, UC-DS-\*, UC-KM-\*, UC-CC-\* | Product Owner + Engineering Lead |
| **Compliance & Audit** | UC-CA-001, UC-CA-002 | Product Owner + Engineering Lead + Compliance Officer |

> [!WARNING]
> **Sign-Off Requirement**  
> UC-CA use cases may not be marked as “Implemented” without explicit written sign-off from the designated Compliance Officer. Sign-off must include confirmation that PII handling per CIC-SPEC-MCP-001 §8.4 has been validated through audit log inspection in the staging environment.

---

## 6. Open Issues
The following issues are currently open and may impact use case implementation or acceptance. All issues are tracked in the CIC engineering backlog. Owners are responsible for providing status updates at each sprint review.

| Issue ID | Use Case | Description | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| **OI-001** | UC-PD-002 | Cross-reference accuracy benchmarking methodology has not been finalized. A minimum of 10 test specification documents is required for statistically valid precision/recall measurement, but only 3 are currently available in the test corpus. Additional test documents must be sourced or synthesized before UAT can begin. | Engineering Lead | In Progress — target resolution: 2026-07-31 |
| **OI-002** | UC-CA-001 | PII redaction rule set for compliance document processing has not been finalized. Legal and Compliance teams are reviewing the list of PII field types to be detected and redacted per CIC-SPEC-MCP-001 §8.4. Until finalized, UC-CA-001 UAT cannot proceed. | Compliance Officer | Pending Legal Review — target resolution: 2026-07-25 |
| **OI-003** | UC-CC-002 | Session concurrency load testing has not been conducted for the concurrent session limit defined in CIC-SPEC-MCP-001 §2.3. It is unknown whether the Session Sync Service can maintain the 5-second context injection SLA under maximum concurrent participant load. Load test plan is drafted but infrastructure provisioning for the test environment is pending. | Infrastructure Lead | Blocked — awaiting test environment provisioning; target resolution: 2026-08-15 |
| **OI-004** | UC-DS-002 | Implied risk identification heuristics require calibration. Initial UAT results (informal) indicate a false positive rate of approximately 25% for implied risks inferred from activity data, exceeding the acceptable threshold. Prompt engineering refinement and a structured calibration pass against validated risk register examples are required. | AI/ML Engineering | In Progress — calibration sprint scheduled for 2026-07-14 |
| **OI-005** | UC-RS-003 | Activity feed rate-limiting thresholds (50 events/minute ceiling; 30-second batch window for lower-priority events) have not been validated against real-world workspace activity profiles. Data from Phase 1–6 production workspaces must be analyzed to confirm that the thresholds are appropriate and do not result in excessive batching during peak activity periods. | Platform Engineering | Open — data analysis not yet initiated; target resolution: 2026-08-01 |

---

## 7. Document Revision History

| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-05-01 | CIC Integration Team | Initial use case set covering Phases 1–4 baseline: UC-RS-001, UC-RS-002, UC-PD-001. Persona table, integration depth level definitions, and acceptance criteria framework established. |
| **1.1** | 2026-06-15 | CIC Integration Team | Added Compliance & Audit domain (UC-CA-001, UC-CA-002) and Knowledge Management domain (UC-KM-001, UC-KM-002). Updated coverage matrix. Added PII handling references per CIC-SPEC-MCP-001 §8.4. Added Section 5.3 sign-off requirements for UC-CA use cases. |
| **1.2** | 2026-07-09 | CIC Integration Team | Expanded to 14 use cases: added UC-RS-003, UC-PD-002, UC-PD-003, UC-DS-001, UC-DS-002, UC-CC-001, UC-CC-002. Introduced Level 3 (Deep Integration) depth classification. Added cross-references to CIC-SPEC-MCP-001, CIC-ROAD-001, and CIC-SPEC-NLM-001 throughout. Added Section 6 (Open Issues). Updated coverage matrix and Table of Contents. |

---

## See also:
* [CoWork MCP Integration Spec v1.2](../reference/cowork-mcp-integration-spec.md)
* [NotebookLM v1.2 Roadmap Addendum](../roadmaps/notebooklm-v12-roadmap-addendum.md)
* [NotebookLM Core Spec](notebooklm-integration-plan.md)
* [NotebookLM MCP Architecture](../reference/notebooklm-mcp-architecture.md)


