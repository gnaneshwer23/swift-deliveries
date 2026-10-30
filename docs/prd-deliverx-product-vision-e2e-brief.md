# DeliverX product vision and end-to-end build brief (in-repo record)

**Source:** Founder document `DeliverX_Product_Vision_and_End_to_End_Build_Brief.docx` (extracted 30 Oct 2026 via `textutil -convert txt`).  
**Repository baseline for status mapping:** `main` @ Phase A merge (see git log); prior baseline `30fe4c66`.  
**Related:** `AGENTS.md`, `README.md`, `docs/psi-investigation-stage-vision.md`, `docs/prd-deliverx-supervised-ai-workforce.md`, `docs/phases/q0-background-investigation-contract.md`, `docs/mission-worker.md`, `docs/psi-phase-6-release-acceptance.md`.  
**Recent product change:** [PR #66](https://github.com/gnaneshwer23/swift-deliveries/pull/66) (merged 30 Oct 2026) — investigation scope review gate and honest Studio journey copy.

This file is the **durable product record** of the external brief plus an **honest gap map** against the codebase. It does not certify production readiness or live provider execution.

---

## Status labels (from the brief — use in all discussions)

| Label | Meaning |
| ----- | ------- |
| **Implemented and verified** | Evidence shows the real application path works in the stated environment. |
| **Implemented, live verification pending** | Code exists; no real service/browser run proves it yet. |
| **Partial** | Some parts work; connected journey or operational behaviour is missing. |
| **Simulated or fixture-only** | Useful for design/tests; not proof of live execution. |
| **Proposed** | Product intention; not a claim about current code. |

Workforce quality labels remain **Agent-reviewed / Automatically tested / Human-reviewed / Externally attested** — never generic “Verified”. Human lifecycle gates are human-only; agents may block, not pass.

---

## Brief summary (what DeliverX is meant to be)

DeliverX is an **AI product team** that helps a person move from a rough idea to researched, planned, built, and tested product work while the **customer keeps direction and authority**.

- **One user-facing coordinator:** the AI Product Manager (PM), not a directory of chatbots or disconnected tools.
- **Operating rule:** agents prepare and perform **approved** work; the customer owns decisions, scope, and consequential actions.
- **Honesty rules:** mark unknowns; separate evidence from inference; show real task/event-backed progress; disclose provider limits, simulated output, and failures; bind approvals to scope versions; preserve history on return.
- **Destination (full vision):** idea → PM analysis → customer approval → **project-specific specialist team** → iterative bounded work with truthful progress → **inspectable handover package** (including code/test evidence when engineering stages run). Investigation-to-export is the **first reliable milestone**, not the whole product ceiling.
- **Architecture intent:** keep React/TypeScript/TanStack Start, Neon/PostgreSQL, Neon Auth, and server-side worker model; **own** workflow state (approvals, tenancy, usage, artefacts, audit, export); optional bounded adapters (e.g. OpenAI Agents SDK) must not bypass gates. Hermes Agent and similar frameworks are **spike-only** until multi-tenant operational evidence exists.

The brief explicitly warns: do not call the product production-ready or imply all catalogue roles operate as live agents without fresh end-to-end proof.

**Chat UI:** The brief describes the PM as the main conversation partner for clarification and decisions. It does **not** position DeliverX as a generic chat-SDK demo; Studio is PM-led investigation and briefing (`docs/psi-investigation-stage-vision.md`). No separate “chatbot product” direction is required unless future specs add it.

---

## What `main` contains today (brief §3 — confirmed)

| Area | Brief claim | Repo alignment @ baseline |
| ---- | ----------- | ------------------------- |
| Public + auth foundation | Substantial PSI foundation, Neon, missions | **Partial / implemented, live verification pending** — see `docs/psi-production-readiness-plan.md` (historical plan; not a cert). |
| Signed-in Studio journey | Foyer → scope review → approve → canvas → PM briefing → path/decision → export | **Partial** — route and UI spine on `psi_supervised_missions`; scope review strengthened in PR #66. |
| Worker / `wf_*` spine | Separate durable missions, leases, usage | **Partial → implemented, live verification pending** — `docs/mission-worker.md`; Phase **A1+A2** adapter + migration **0034** on production and preview Neon (`docs/pilot-mission/studio-workforce-adapter.md`); fixture Neon proof in `docs/psi-phase-a-preview-acceptance.md`. |
| Phase 6 acceptance | CI green | **Simulated or fixture-only** for journey proof — `docs/psi-phase-6-release-acceptance.md` (`MemoryStore`, no live browser/provider billing run). |
| Capability catalogue | Many roles/tests exist | **Partial** — catalogue ≠ executable, customer-assigned team at scale. |

Phase **A1** adds an explicit adapter and field ownership (`docs/pilot-mission/studio-workforce-adapter.md`). Human plan approval and investigation usage remain on the supervised mission; wf mirrors execution and events only.

---

## End-to-end journey map (brief §4–§10 vs `main`)

| Brief stage | Intent (condensed) | Mapped status @ `30fe4c66` | Notes |
| ----------- | ------------------ | ---------------------------- | ----- |
| **1 — Discover** | Truthful marketing: home, how it works, example mission, specialists (live vs catalogue), trust, pricing pilot, resources; CTAs “Start with an idea” / “Inspect an example” | **Partial** | Routes exist (`/`, `/how-it-works`, `/psi`, `/pricing`, `/security`, `/resources`, …). Example mission and “which capabilities are live” labelling need ongoing honesty passes (`docs/psi-phase-2-journey-verification.md`). |
| **2 — Onboarding** | Few minutes; personal prefs **separate** from project facts; skip optional; vision recap before work | **Partial** | `/_authenticated/onboarding` captures role, goal, idea via `dx_profiles`; not full preference surface (accessibility, explanation depth, communication style as first-class editable prefs). |
| **3 — Dashboard** | Calm hub: continue project, needs attention, projects list, shortcuts, usage; in-project nav (Briefing, Evidence, Team, Decisions, …) | **Partial** | `/command` investigation foyer (PR #66) + `/command/portfolio` side room; not full Stage 3 “needs your attention” hub with all project destinations active-only-when-real. |
| **4 — Idea + scope review** | PM interpretation, in/out of scope, missing info, provider/cost disclosure, approve/edit/discuss; approval binds brief version | **Partial → implemented, live verification pending** | `InvestigationScopeReview`, `SupervisedBriefEditor` (PR #66); stale-approval on material edit needs explicit product/tests alignment with brief §4. |
| **5 — Visible analysis** | Event-driven canvas/list; reduced motion; no timer theatre; label simulated/unconfigured providers | **Partial** | `InvestigationExperience` clusters from persisted handoffs (`docs/psi-investigation-stage-vision.md`); research may still be request-coupled/fixture-heavy until worker link. |
| **6 — PM briefing** | Full customer-facing brief: problem, competitors with sources, evidence pro/con, risks, team proposal, indicative timeline/cost as estimates, next decision | **Partial** | `InvestigationPmBriefingStage` tabbed presenter; depth varies by data/provider mode; simulated draft labelling required. |
| **7 — Team formation** | Smallest team for approved work; role contract; Draft→Available lifecycle; no “150 roles” wall | **Partial** | Team activity / catalogue / agents office exist; **not** the brief’s post-approval “5–14 capability” mission-specific roster on durable tasks. |
| **8 — Iterative delivery** | Bounded tasks, durable worker, leases, notifications only if real, pause/cancel | **Partial (worker + Studio link fixture)** | `studio_research_pass` via adapter; daily cron + `CRON_SECRET` added 30 Oct 2026; `waitUntil` on live approve still unverified. |
| **9 — Final package** | ZIP + manifest: PRD, research, design, code, tests, defects, decision log, provenance | **Partial** | Supervised export/ZIP/PDF in tests (`phase-6-release-acceptance`); not full engineering deliverable set from brief §9. |
| **10 — Learning + return intelligence** | Optional explanations tied to **this** project; “what changed since last visit” | **Proposed / Partial** | Some inspection/inbox derivation; not full continued-intelligence loop. |
| **§5 Marketing design** | Hero, interactive labelled journey, sample deliverables, FAQ on live capabilities | **Partial** | Homepage foundation preserved; interactive journey and sample inspectable artefacts incomplete vs brief. |
| **§6 Architecture** | Connect Studio ↔ worker; app-owned contract | **Partial → fixture-verified, browser pending** | A1+A2 on `main`; preview **0034** applied; tick 503 resolved in repo (env + cron); signed-in preview journey still open. |
| **§7 Build sequence A–E** | A real journey → memory → artefacts → engineering → commercial | **Proposed roadmap** | Aligns with repo priorities below. |
| **§8 Acceptance measures** | Outcome-based checklist (sources, approval binding, isolation, export provenance) | **Partial** | Many checks covered in **fixture tests**; live isolation + provider failure browser proof outstanding. |

---

## Gap analysis vs live product (concise)

### Aligned with the brief (do not regress)

- PM-led **investigation foyer** and **decision briefing** direction (`docs/psi-investigation-stage-vision.md`), not agent-card theatre as primary surface.
- **Human gates** and no auto-pass of lifecycle gates (`AGENTS.md`).
- **Honest provider posture** (simulated default when keys absent; research gaps labelled).
- **Persisted supervised missions** with export and inspection patterns tested under fixtures.
- **Separate `wf_*` worker** design with leases, usage ceiling, and event log (for workforce missions).

### Top gaps (brief destination vs `main`)

1. **Studio ↔ durable worker (Phase A)** — Fixture Neon proves approve → wf link → worker research pass (`docs/psi-phase-a-preview-acceptance.md`); **live** preview chain with provider citations and export still unproven in browser.
2. **Live verification debt** — Phase 6 and most journey tests are **MemoryStore/fixture**; signed-in browser E2E, deployed worker tick/`waitUntil`, and live billing were **not** established in recorded acceptance.
3. **Calm operational dashboard (Stage 3)** — Foyer/portfolio improved; missing unified “needs your attention”, usage-before-billable prominence, and in-project section nav that hides empty shells.
4. **Team formation + iterative loop (Stages 7–8)** — Catalogue and UI depth exist; missing mission-scoped smallest team assignment on **durable** tasks with the brief’s capability contract and customer-visible work items.
5. **Full handover package (Stage 9+) and engineering stages (Phases C–D)** — Export covers supervised decision record; not requirements/design/code/test package with reproducible build evidence and release approval.

### Out of scope for Stage 1 (brief agrees implicitly)

- Automatic production deployment without explicit release approval.
- Self-service commercial billing and scheduled monitoring (**Phase E**) before recovery and cost measurement.
- Treating 150 catalogue roles as live agents.
- Books/publishing and regulated healthcare (`AGENTS.md`).
- Career workspace as primary signed-in home (retired redirects; archive in `docs/archive/career/`).

### Superseded docs

- `docs/prd-gap-analysis.md` — historical **career vs workforce** transition; use this file + `docs/psi-production-readiness-plan.md` / phase evidence for current PSI gaps.

---

## Recommended implementation phases (smallest high-value first)

Aligned with brief §7 and repo architecture (`q0-background-investigation-contract.md`, `mission-worker.md`).

| Order | Slice | Outcome | Exit evidence |
| ----- | ----- | ------- | ------------- |
| **A1** | **Authoritative link** supervised scope revision ↔ worker job | One adapter; no duplicate approval/budget ownership | Design note + migration if needed; fields documented |
| **A2** | **Single approved investigation** through worker | Persisted tasks/events → briefing inputs → export | Signed-in preview run with small provider budget; retry/cancel/stale approval tests |
| **A3** | **Operational worker** | CRON tick + deployed `waitUntil` verified | `mission-worker.md` + post-redeploy tick 200; `waitUntil` observe on approve |
| **B** | Project memory + return | Versioned context, “what changed”, grounded Q&A with citations | Workspace-isolated tests + UI on `/command` |
| **C** | Product artefacts | Requirements, journeys, design outputs from approved decisions | Artefact contracts + human review gates |
| **D** | Bounded code generation | Isolated workspace, diffs, test logs, no auto-deploy | Package includes build/test evidence and open defects |
| **E** | Commercial + monitoring | Billing, notifications, team collaboration | Only after A–D reliability and measured cost |

**Next recommended slice:** **Phase A3 completion** — after redeploy, confirm tick **200** with bearer auth; one signed-in live investigation on preview with small provider budget. **A1+A2** adapter + preview **0034** + fixture acceptance recorded 30 Oct 2026 (`docs/psi-phase-a-preview-acceptance.md`).

---

## Acceptance measures (brief §8 — tracking)

Use as release checklist for Phase A pilot; mark each row with evidence link (test name, preview run id, or doc).

- [ ] User can edit/reject PM understanding before approval (scope review UI).
- [ ] Every displayed canvas/task step maps to persisted event (no timer-only theatre).
- [ ] Factual claims have source or explicit inference/unknown label.
- [ ] Leave and return preserves brief, tasks, evidence, decisions (DB-backed, not memory-only).
- [ ] Material brief edit invalidates stale approval.
- [ ] Cross-workspace denial in automated + one live isolation check.
- [ ] Provider failure never shown as completed research.
- [ ] Export matches approved decision with provenance in manifest.
- [ ] Cost/usage visible before consequential provider work.

---

## References (from brief §10)

- Repository: https://github.com/gnaneshwer23/swift-deliveries  
- Baseline commit: https://github.com/gnaneshwer23/swift-deliveries/commit/30fe4c66ee767f3546f2a32046ec07c45818efb2  
- CI (brief): https://github.com/gnaneshwer23/swift-deliveries/actions/runs/41130950722  
- Worker: `docs/mission-worker.md`  
- Fixture acceptance: `docs/psi-phase-6-release-acceptance.md`  
- Public journey boundary: `docs/psi-phase-2-journey-verification.md`  

Framework notes in the brief (Hermes Agent, OpenAI Agents SDK) remain **evaluate in spike** — not install/migrate decisions.

---

## Document maintenance

When merging product changes that affect journey or worker wiring:

1. Re-read `main` README and trace supervised + `wf_*` code paths before updating status columns.
2. Bump **Repository baseline** commit SHA in the header when re-baselining.
3. Never upgrade “Partial” to “Implemented and verified” without cited environment evidence.
