> Historical transition analysis; the current direction is docs/psi-production-readiness-plan.md.

# PRD gap analysis — career product vs supervised workforce

**Date:** 21 Oct 2026 · **PRD:** `docs/prd-deliverx-supervised-ai-workforce.md`

## Current product (what exists)

DeliverX today is primarily a **career / Professional Intelligence** product:

- Simulated organisations (Experience), evidence ledger, capability judgements
- Launchpad portfolio, Prove / Open Badges attestation (“Verified” only via external attestation)
- Coaching, interview lab, applications, billing entitlements
- A separate Delivery-OS schema (`projects`, `tasks`, `artefacts`, `audit_events`, org memory, agents, …) largely unused by the TanStack UI

Signed-in home (`/workspace`) is a **candidate daily briefing**, not a workforce Command Centre.

## PRD target

Supervised AI workforce: **Mission → Plan → Approve → Execute → Deliver** with permission ladder, usage ceiling, evidence/quality labels, and Investigate / Prototype / Improve intents.

## Gaps (concise)

| PRD need                             | Current state                                                           | Stage 1 action                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Command Centre shell                 | Career workspace nav                                                    | New `/command` shell + routes                                                               |
| Workspace / Project / Mission model  | Delivery-OS `projects`/`tasks` are org-delivery shaped; name collisions | Additive `wf_*` tables + RLS                                                                |
| NL mission intake + clarification    | None                                                                    | Deterministic planner stub                                                                  |
| Plan + approval UX                   | Governance tables unused in UI                                          | Mission plan + approval in slice                                                            |
| Permission ladder                    | Not modelled for AI labour                                              | Enforced in planner/executor + UI                                                           |
| Usage ceiling                        | Stripe entitlements for career plans                                    | Local credit ceiling on `wf_workspaces`                                                     |
| Quality labels (no generic Verified) | Career “Verified” is attestation-specific                               | Workforce uses Agent-reviewed / Automatically tested / Human-reviewed / Externally attested |
| Durable execution / artefacts        | Simulation evidence only                                                | Stub executor + `wf_artefacts`                                                              |
| Stripe / live models / connectors    | Partial career Stripe; no AI keys                                       | Out of scope for Stage 1                                                                    |

## Schema conflicts (do not destroy)

| Legacy table                                     | Conflict                   | Resolution                                                               |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------ |
| `projects`, `tasks`, `artefacts`, `audit_events` | Same names as PRD entities | Use `wf_projects`, `wf_mission_tasks`, `wf_artefacts`, `wf_audit_events` |
| Career “Verified” semantics                      | Must not dilute            | Workforce UI never shows bare “Verified”                                 |

## What Stage 1 does **not** close

Multi-member RBAC, live model routing, external connectors, Stripe metering, human-reviewer queues, marketplace agents, retiring the career product.
