# DeliverX — Supervised AI Workforce Platform

**Product Requirements Document · v1.0 (Stage 1 slice)**  
**Status:** Adopted for this repository (host decision §20.1)  
**Date:** 21 Oct 2026

> This document captures the product direction for DeliverX as a **Supervised AI Workforce Platform**. The previous career / evidence / Experience product remains in the codebase as a legacy surface; Stage 1 ships a usable Command Centre vertical slice, not the full platform.

---

## 1. Problem

Knowledge workers and small teams need outcomes (briefs, prototypes, improvements), not chat threads. Generic copilots draft text; they do not run supervised work with plans, budgets, permission ladders, evidence classification, and human approval gates.

## 2. Solution

DeliverX is a **command centre for supervised AI labour**:

1. The human states a mission in natural language.
2. The system clarifies incomplete requests.
3. It proposes a plan (tasks, acceptance criteria, usage estimates).
4. The human approves within a permission ladder and budget ceiling.
5. Agents execute with visible progress, artefacts, and evidence labels.
6. Delivery ends in a reviewable report — not a disposable chat.

## 3. Positioning

| Not this                          | This                                                  |
| --------------------------------- | ----------------------------------------------------- |
| Agent marketplace / directory     | Supervised workforce under human authority            |
| Unbounded autonomous agents       | Permission ladder + explicit external-action approval |
| Generic “Verified” badges         | Discrete quality labels (see §9)                      |
| Career simulation record (legacy) | Mission → Plan → Approve → Execute → Deliver          |

**Public name:** DeliverX  
**Stage 1 home (signed-in):** Command Centre (`/command`)

## 4. Primary personas (Stage 1)

- **Operator** — founder / product lead who commissions missions and approves plans.
- **Reviewer** (later) — human who marks artefacts Human-reviewed.
- **Attestor** (later) — external party for Externally attested.

Stage 1 implements Operator only.

## 5. Journey A — Command Centre (MVP)

Entry intents:

| Intent          | Purpose                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| **Investigate** | Research / analysis → brief with sourced facts vs assumptions                    |
| **Prototype**   | Lightweight interactive / HTML / structured UI prototype (not production deploy) |
| **Improve**     | Diagnose and propose improvements to an existing artefact or flow                |

Core loop:

```
Intent → Mission intake → Clarification (if needed) → Plan → Approval
  → Queued → Running (task graph) → Reviewing → Completed (+ report)
```

## 6. Domain model (Stage 1 entities)

| Entity          | Role                                                                |
| --------------- | ------------------------------------------------------------------- |
| **Workspace**   | Isolation boundary for a user (or team later)                       |
| **Project**     | Container for related missions                                      |
| **Mission**     | Natural-language request + status machine                           |
| **MissionPlan** | Tasks, acceptance criteria, usage estimate, permission requirements |
| **Task**        | Unit of work in the plan / execution graph                          |
| **Artefact**    | Deliverable content (brief, HTML prototype, report section, …)      |
| **Approval**    | Explicit human gate (plan approval; external-action approval)       |
| **UsageRecord** | Billable step against a budget ceiling                              |
| **AuditEvent**  | Append-only trail of status / approval / usage changes              |

> **Schema note:** Legacy Delivery-OS already owns `projects`, `tasks`, `artefacts`, and `audit_events`. Stage 1 tables are prefixed `wf_*` (workforce) to remain additive and avoid destructive conflicts. See `docs/prd-gap-analysis.md`.

## 7. Mission status machine

| Status                | Meaning                                            |
| --------------------- | -------------------------------------------------- |
| `draft`               | Intake captured; not yet planned                   |
| `needs_clarification` | Missing critical inputs; questions outstanding     |
| `planned`             | Plan generated                                     |
| `awaiting_approval`   | Plan ready for human approval                      |
| `queued`              | Approved; waiting to run                           |
| `running`             | Executing tasks                                    |
| `reviewing`           | Execution finished; delivery report assembling     |
| `completed`           | Delivered                                          |
| `partially_completed` | Stopped with some tasks done (e.g. budget ceiling) |
| `blocked`             | Waiting on external approval or unmet permission   |
| `failed`              | Unrecoverable execution failure                    |
| `cancelled`           | Operator cancelled                                 |

## 8. Permission ladder

Surfaced in UI; enforced in planner/executor:

1. **Plan** — propose work (always allowed for Operator).
2. **Create** — create internal artefacts.
3. **Execute internally** — run internal analysis / generation steps.
4. **Act externally** — email, deploy, publish, call third-party APIs **only after explicit approval**.

Stage 1: plans that include external actions stay `blocked` / require a separate external-action approval before those tasks run. Internal tasks may complete first.

## 9. Quality & evidence labels

### 9.1 Quality labels (must not misuse generic “Verified”)

| Label                    | Meaning                                 |
| ------------------------ | --------------------------------------- |
| **Agent-reviewed**       | Another agent pass checked the artefact |
| **Automatically tested** | Automated checks ran                    |
| **Human-reviewed**       | A named human reviewed                  |
| **Externally attested**  | Outside party attested (later stages)   |

### 9.2 Evidence classification

| Class             | Meaning                               |
| ----------------- | ------------------------------------- |
| **Sourced facts** | Traceable to an input or cited source |
| **Assumptions**   | Explicitly assumed for the mission    |
| **Inferences**    | Derived from facts + assumptions      |
| **Speculative**   | Weakly grounded suggestion            |

## 10. Usage & budget

- Each workspace has a **usage ceiling** (Stage 1 default: 100 credits).
- Billable simulated steps record usage.
- When the ceiling is reached, further billable steps **hard-stop**; mission may end `partially_completed`.

Stripe metering is **out of scope** for Stage 1 (no Stripe required).

## 11. AI providers

- If provider keys exist in the environment, they may be used for planning/execution.
- Otherwise a **deterministic high-quality stub** planner/executor must produce tangible artefacts for Investigate / Prototype / Improve.

Stage 1 decision (§20.3): **stub / deterministic** unless keys are present.

## 12. Stage 1 / MVP scope (this slice)

**In:**

- Authenticated Command Centre shell
- Project create + list (Supabase `wf_*` with RLS, or documented local durable fallback)
- NL mission intake + clarification questions
- Plan generation + approval UX
- Status machine through completion
- Simulated durable execution: task list, artefacts, evidence labels, delivery report
- Permission ladder UI + external-action gate
- Usage ceiling display + hard stop
- Unit tests for planner / permissions / usage / status

**Out (Stage 1):**

- Full multi-agent orchestration marketplace
- Real external integrations (email, deploy, Slack, GitHub write)
- Team RBAC beyond single-operator workspace
- Stripe billing / metered invoices
- Career Experience / Prove / Launchpad rebuild
- Production prototype hosting / custom domains
- Mobile native apps
- Human-reviewed / Externally attested workflows end-to-end (labels only)

## 13. Non-goals

- Replacing the legacy candidate product overnight
- Unbounded autonomous spend
- Claiming “Verified” without external attestation semantics from the career product

## 14. Success criteria for Stage 1

An authenticated user can, in one browser session:

1. Open Command Centre
2. Create a project
3. Start Investigate, Prototype, or Improve
4. Answer clarifications if prompted
5. Review and approve a plan (seeing usage estimate + permissions)
6. Watch tasks run (or hit budget stop)
7. Open artefacts + final delivery report with correct quality/evidence labels

## 15–19. Later stages (summary)

Reserved for multi-member workspaces, live model routing, external connectors, attestation workflows, and commercial metering. Not required for Stage 1.

## 20. Open decisions — Stage 1 resolutions

| #   | Decision                     | Stage 1 choice                                                                                                           |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Host                         | **This existing codebase** (`swift-deliveries` / DeliverX)                                                               |
| 2   | First prototype target       | **Reviewable product brief + lightweight interactive/HTML or structured UI prototype artefacts** (not production deploy) |
| 3   | Model providers              | **Stub / deterministic** unless keys exist                                                                               |
| 4   | Multi-tenant team model      | Out of scope — single-operator workspace                                                                                 |
| 5   | Stripe / commercial metering | Out of scope — local credit ceiling only                                                                                 |
| 6   | External connectors          | Out of scope — gated as Act externally                                                                                   |
| 7   | Career product fate          | Coexist; Command Centre is new signed-in primary                                                                         |
| 8   | Custom domains / hosting     | Out of scope                                                                                                             |
| 9   | Real-time multiplayer        | Out of scope                                                                                                             |
| 10  | Mobile                       | Responsive web only                                                                                                      |
| 11  | Human-review workflow        | Label only; no reviewer queue                                                                                            |
| 12  | Extern / marketplace agents  | Out of scope                                                                                                             |

---

## Appendix A — Routes (Stage 1)

| Path                           | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `/command`                     | Command Centre home — intents + recent missions |
| `/command/projects`            | Project list / create                           |
| `/command/projects/$projectId` | Project missions                                |
| `/command/missions/$missionId` | Mission detail (clarify → plan → run → report)  |

Legacy `/workspace/*` career surfaces remain available.
