# Strategy: One-liner → PM brief → living work scene → decision pack

**Status:** Phase B **shipped** on `main` (Option C Hybrid + research-first). Light Phase C work scene included.  
**Date:** 27 October 2026  
**Context repo:** `swift-deliveries` · prior vertical slice `c0361e7`; intake reshape follows this strategy  
**Live pain reference:** `/command/supervised/{missionId}` previously felt like a questionnaire, not an agent-staffed build.

Prior approved decisions still bind: decision pack first; supervised decision loop as default; web research only when configured; voice after typed path; defer agents office as primary / full ZIP / broad always-on 150-role catalogue.

---

## 1. Product definition

**What we’re building (founder language):**

DeliverX turns a **one-line business case** into a **supervised, agent-staffed product investigation** you can watch and approve — not a form you fill before anything happens.

The initiating experience is an **initiating PM agent** that:

1. Takes a short business case (typed now; oral later).
2. Briefs the problem in plain language.
3. Shows a **living visual / “movie scene”** of specialists starting work.
4. Returns a **PM brief** of proposed plan, cost, time, and delivery team (sized to complexity).
5. Runs **research-led case building** (market, competitors, sites) and only asks clarifying questions when the case cannot honestly proceed.
6. Ends the first arc at an inspectable **decision pack** (and experiment brief), with humans owning every gate.

Team size **scales with case complexity** (~20 for simple → ~100 for hard → hard ceiling ~150). Not 150 every time. Not a forever-fixed team of 8. **This ship:** Band S / Wave 1 (~8) active; higher bands labelled only.

This is still the supervised decision loop — reframed as *staffed work you watch*, not *fields you complete*.

---

## 2. Architecture chosen

**Option C (Hybrid)** — keep one Command primary path and `/command/supervised/:id` through intake. No `/cases` fork. Research-first questions policy. Progressive visual scene (graph + activity first; cinematic layer later).

---

## 3. Target experience (beat-by-beat)

| Beat | User sees / does | System does | Gate |
| --- | --- | --- | --- |
| **0. One-liner** | Types a short business case | Creates supervised mission; does **not** demand audience/outcome/constraints | None |
| **1. PM initiation** | Written PM brief: “Here’s what I heard…” | Problem statement, knowns/unknowns, plan, cost/time bands, team | Soft correct in reply / revise |
| **2. Movie scene** | Living graph + activity stream | Provisional Band S team; status from persisted events | None (honesty labels) |
| **3. PM plan brief** | Approve plan card | Deterministic PM stub discloses honesty | **Approve plan** (human-only) |
| **4. Research-led case build** | Evidence / gaps | Web when configured; honest gaps otherwise | Ceiling / consent |
| **5. Options → decision** | Compared options | Existing supervised path | **Owner decision** |
| **6. Decision pack** | Export PDF + Markdown | Existing pack path | Export / review |

---

## 4. Roadmap phases

| Phase | Status |
| --- | --- |
| **A — Experience contract** | Done (this doc + founder “build”) |
| **B — Intake reshape** | **Shipped** — one-liner primary; optional advanced collapse; PM brief before approve; research-first Combined default |
| **C — Living scene** | **Light shipped** — graph + persisted activity; no fake timer theatre; full cinematic office deferred |
| **D — Complexity-scaled staffing** | Deferred — bands labelled; only Band S Wave 1 staffed |
| **E — Research-led case building** | Partial — Combined + honest gaps; full provider-driven research when keys configured |
| **F — Voice initiation** | Deferred — typed path first |

---

## 5. Binding constraints (reminder)

- Decision pack first; supervised decision loop default.
- Web research only when configured.
- Voice after typed path.
- Defer: agents office as primary; full programme ZIP; broad always-on 150 catalogue.
- Additive persistence / workspace isolation; no legacy Delivery-OS mutation for this work.
- Books/publishing and regulated healthcare out of scope.
- Never fabricate customers, interviews, or observed outcomes.
- Humans pass lifecycle gates; plan approval before billable comparison; follow-ups never auto-start.
