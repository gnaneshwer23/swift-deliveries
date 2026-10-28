# DeliverX — Business plan & product vision

**Date:** 28 October 2026  
**Status:** Vision and **working product direction** (stamped business case + progressive transparency amendment). This document explains *what we are building* for founders and partners. It is not a production-readiness certificate, a revenue forecast, or an engineering specification.

**Grounded in:** `docs/business-case-deliverx-psi-v2.md` (v2.1), `docs/business-case-deliverx-psi-v2.2-progressive-transparency.md`, `docs/psi-quiet-studio.md`, `AGENTS.md` (DeliverX PSI direction), and the shipped Studio spine through Quiet Studio and Phase 1 local acceptance.

---

## Vision (one paragraph)

DeliverX is becoming a **supervised AI product company in software form**: you describe an idea in a sentence or two, and a visible research team investigates it with real events and cited sources—not theatre. A named PM returns a briefing you can read (or listen to in the browser) with a **four-outcome recommendation** (test, revise, pause for evidence, or do not pursue). You choose the next authorised path; only then does DeliverX staff a **continuation team** for that step, produce a downloadable plan, and open a **persistent project room** where specialists collaborate, hand off work, and leave an inspectable trail. The default signed-in experience is **Quiet Studio**: calm while agents work, clear when you must decide, deep when you download packs and roadmaps. Career coaching and CV packaging are retired; the spine is **investigate before you build**, then execute the next bounded step with human gates throughout.

---

## Who it is for

| Priority | Audience | Why they care |
| --- | --- | --- |
| **Primary** | Founders and small product teams | Defensible commitments, visible diligence, continuation without losing the verdict |
| **Secondary** | Students and PM learners | Same spine—they practise judgement on *their* case, not agent activity volume |

DeliverX is **not** positioned as job applications, professional credentials, or coaching dashboards. Historical career material lives in `docs/archive/career/` and is not current product guidance (`AGENTS.md`).

---

## The experience we are building (Quiet Studio)

Progressive transparency (v2.2) states the design principle:

> DeliverX should feel calm while it works, clear when it briefs you, and deep when you inspect it.

**Front stage** (`/command` and supervised missions):

- **Brand plus one command line**—text or voice into the same one-liner (browser speech; no cloud TTS product charge by default).
- **Status from real mission state**—Idle, Investigating…, Needs your decision—not fake timers.
- **Notifications** list cases that need you; opening a case shows a gate card and event-backed canvas, not walls of evidence by default.
- **Inspect** opens the full record: project room, evidence editors, commerce honesty panels, PM briefing depth.

**Human control (unchanged):** AI drafts; you approve plans, paths, prototypes, and any external act. Voice never auto-approves gates.

**Depth in downloads:** Decision pack, executive pack, decision ZIP, and full archive include a **Decision roadmap**—timeline of human gates, research, recommendation, your path, artefacts, and task events, with honest simulated-draft vs model labels where recorded (`docs/psi-quiet-studio.md`).

---

## Journey (idea → portfolio)

```text
IDEA (one or two sentences)
        │
        ▼
INVESTIGATION — visible diligence, research-team ownership, Intelligence Canvas
        │         (continue in background; notify-when-ready = preference only today)
        ▼
PM BRIEFING — feasibility, demand, proposition, investment; four-outcome recommendation
        │         + counterevidence, alternatives, unknowns, smallest next step
        ▼
HUMAN CHOICE — test | revise | gather evidence | close (verdict preserved if you disagree)
        ▼
CONTINUATION — team + plan for the *chosen* step only; approve within permission bounds
        ▼
PROJECT ROOM — one persistent case: overview → monitoring, agent folders, handoffs, gates
        ▼
OUTCOMES — outcome review proposes next mission; never auto-started
        ▼
PORTFOLIO & EXPORTS — command centre, executive vs full archive, decision roadmap in ZIPs
```

Acts A–C in the stamped business case are **views inside one case**, not separate products that force you to rebuild context (`docs/business-case-deliverx-psi-v2.md`, §0).

---

## What is already built vs still planned

**Honest snapshot (28 Oct 2026).** Capability is **owner-reported** in repo docs unless a release candidate has been checked under `docs/psi-production-readiness-plan.md`.

### Shipped on Studio (local/dev and codebase; not “production certified”)

| Area | What exists |
| --- | --- |
| **Investigate entrance (P-A, PT-1)** | Idea input, commitment panel, event-backed Intelligence Canvas, PM briefing with separated assessments and four-outcome framing |
| **Path & continuation (P-B, PT-1 R4)** | Human path choice; continuation team after approval and commercial rules |
| **Project room (P-C, PT-2)** | Persistent nav; Act A remains reachable |
| **Exports (PT-3)** | Executive pack vs full archive; honest manifest; **Decision roadmap** in packs |
| **Portfolio (PT-4, PT-5)** | Search, filters, similar-idea assist |
| **Watchtower (PT-6)** | **Preferences only**—last/next/failures shown honestly as unset until a runner exists |
| **Quiet Studio UX** | Default calm command surface; inspect for depth (`docs/psi-quiet-studio.md`) |
| **Commerce rules (P-commerce)** | Disclosure and allowance logic in product; **paid availability** requires founder-owned live payment approval |
| **Phase 1 vertical slice** | End-to-end Idea → briefing → path → export **complete for local, test-backed scope** (`docs/psi-phase-1-vertical-slice-verification-report.md`) |

### Known gaps (labelled in product copy where surfaced)

| Gap | Posture |
| --- | --- |
| **Push/email notifier** | “Notify when ready” persists preference; **delivery not live** (v2.2 R9) |
| **Watchtower runner** | No scheduled competitor monitoring until separately authorised |
| **Monitoring commercial allowance** | Disclosed separately; **not charged** until runner ships |
| **File attachments at idea** | Deferred; paste-into-evidence |
| **Live paid checkout** | Stripe plumbing and rules exist; **live Stripe + `PSI_PAYMENTS_LIVE_APPROVED` not set** per roadmap notes |
| **Production readiness** | Explicitly out of Phase 1 acceptance; no claim without checks on the exact candidate |
| **Investigation units in market** | P-paid documents Investigation availability direction; **Continuation SKU later** (v2.2) |
| **Neon Auth** | Current product direction uses Neon and Neon Auth; preview/production auth must match trusted origins |

Do not interpret “shipped” as “safe to sell at scale without founder release checks.”

---

## Commercial model (high level)

Planning default from the stamped business case (§8)—**not re-verified prices here**; prior founder docs mention Builder / Founder / Studio tiers and Investigation allowances; confirm before any paid launch.

| Unit | What the customer buys |
| --- | --- |
| **Investigation mission** | Declared diligence scope, PM verdict, decision pack, bounded next-step outline—not full project-room execution |
| **Continuation mission** | Separately scoped execution: team, plan, artefacts, gates, outcome-review plan |
| **Monitoring (future)** | Watchtower preferences today; recurring checks and monitoring allowance **after** a runner is authorised |

**Rules that matter commercially:**

- **Proceed** does not imply unlimited build—prototype and deep revision sit inside a declared continuation or a **new** mission.
- **Evidence-based pause** is a completed investigation deliverable; **platform failure** is retry/credit/support—not sold as a pause verdict.
- **Hard stops** at usage ceilings before billable overage.
- **P-commerce** (consumption rules, enforcement, disclosure) is a **prerequisite for paid availability**—not a polish phase (`docs/business-case-deliverx-psi-v2.md`, §16).

No revenue numbers, customer counts, or “production-ready billing” claims appear in this document because they are not evidenced in the repo for this date.

---

## Principles that never bend

These bind engineering and copy (`AGENTS.md`, business case §2, v2.2 §“What does not change”):

1. **Evidence honesty** — Product evidence means cited sources, artefact versions, decisions, test logs, and observed outcomes. Never claim an outcome that has not been observed.
2. **No invented customers** — Synthetic interviews are rehearsal-only and labelled; only founder-supplied notes count as evidence. Exports state what is simulated in `project-manifest.json`.
3. **Human approval** — Lifecycle gates are human-only; agents and schedulers may block, never pass. Disagreeing with the PM recommendation is allowed; the recorded verdict and counterevidence remain.
4. **Workspace isolation** — New persistence uses additive `wf_*` / server-enforced workspace scope; missions do not leak across workspaces.
5. **Quality labels** — Agent-reviewed / Automatically tested / Human-reviewed / Externally attested—never generic “Verified”.
6. **Scope** — Books/publishing and regulated healthcare are out of scope.
7. **Model mode** — Opt-in; artefacts disclose model id or simulated draft.

---

## Near-term roadmap (what the founder might authorise next)

Concept freeze (business case §17): expand only via **named phases** in `docs/phases/`, not ad hoc scope.

| Candidate | Why it matters |
| --- | --- |
| **Notifier service** | Make “notify when ready” real without breaking honesty on digests/mute/dedupe |
| **Watchtower runner** | Turn monitoring preferences into scheduled checks; tie to monitoring allowance |
| **Continuation paid SKU** | After Investigation paid path is founder-approved end-to-end |
| **Production readiness pass** | Execute `docs/psi-production-readiness-plan.md` on a specific release candidate |
| **Phase 1 acceptance with limitations** | Formal sign-off on local vertical slice boundaries vs remaining gaps (`docs/psi-phase-one-reliability.md`, forward roadmap in `docs/roadmap.md`) |
| **Attachment / evidence intake** | If idea-stage uploads become in-scope (currently deferred) |

Each item needs an explicit founder **go build** on the phase spec—not implied by this vision doc.

---

## How to try it locally (short)

1. Clone `https://github.com/gnaneshwer23/swift-deliveries`, branch `main`.
2. Node 24: `npm ci --legacy-peer-deps` (or `npm install`), then `npm run dev` (see `README.md`, port 43123).
3. Configure env per `docs/psi-preview-setup.md` and `.env.example`: at minimum **Neon `DATABASE_URL`** (migrations applied), **Neon Auth** URLs so `/command` works signed-in.
4. Optional: research provider key for cited web lines; `DXSI_MODEL_ENABLED=true` only when you accept billable model calls.
5. Walkthrough: `docs/psi-phase-1-vertical-slice-local-demo.md` (~15 minutes: idea → canvas → briefing → path → export).

Checks before you trust the build: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.

---

## Document map (for deeper reading)

| Document | Role |
| --- | --- |
| `docs/business-case-deliverx-psi-v2.md` | Stamped canonical business case (Acts A–C, commerce units, phases) |
| `docs/business-case-deliverx-psi-v2.2-progressive-transparency.md` | Quiet front stage, R1–R9 requirements and honesty limits |
| `docs/psi-quiet-studio.md` | Default UX behaviour |
| `docs/phases/README.md` | Phase authorisation table |
| `docs/roadmap.md` | Implementation history vs production acceptance |

---

*This vision doc was written for founder alignment on 28 October 2026. Update it when the stamped business case or a major phase shipment changes the story—not on every pull request.*
