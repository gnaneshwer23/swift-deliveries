# Phase P-B — Continuation plan (Act B)

**Status:** Implemented on main (founder: “build next” 28 Oct 2026; no paid availability)  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §5.3  
**Depends on:** P-A (four-outcome + human next path)  
**Paid availability:** Not in scope — no Investigation/Continuation commerce enforcement  
**Out of scope:** Act C case room, agent folders, information-flow diagram, live artefact factory, voice, P-commerce

---

## Demo criterion

```text
Human next-path recorded (P-A)
    ↓
Continuation plan for that path
    ↓
Named continuation team (who / why / responsibilities)
    ↓
Ordered roadmap + planned artefact types
    ↓
Downloadable continuation pack
    ↓
Execution blocked where inputs missing (pause / gather-evidence)
```

Someone can explain: *“Here is who is staffed for this next step, why, what they will produce, and what is not included.”*

---

## In scope

| Item | Requirement |
| --- | --- |
| Per-path plan | Map human next path (+ recommendation context) to Act B plan kind |
| Continuation team | Roles depend on the work—no fixed headcount promise |
| Why each role | Responsibility + which decision they improve |
| Roadmap | Ordered steps for the chosen path |
| Planned artefacts | Research memo, chosen-path brief, test/evidence plan; PRD only when path is a bounded test / revise that warrants it |
| Download | Markdown continuation pack with limits, unresolved risks, not-included |
| Disagreement | Founder-requested continuation labels unresolved risks; does not claim agent endorsement |
| Close path | Close plan without staffing a delivery parade |

---

## Artefact defaults by path

| Human next path | Planned artefacts |
| --- | --- |
| Authorise bounded test | Chosen-path brief, test/evidence plan, research memo; PRD if a product change is in scope |
| Authorise revise | Research memo, chosen-path brief, reframing investigation plan (not a premature PRD) |
| Authorise gather evidence | Evidence-collection plan, research memo (execution blocked until inputs land) |
| Close case | Close summary only |
| Founder-requested continuation | Chosen-path brief + unresolved-risk register + scoped next artefacts |

---

## Acceptance checks

1. After next-path record, mission stores a `continuationPlan`.  
2. UI shows continuation team, roadmap, planned artefacts, and blocked state when applicable.  
3. Downloadable Markdown includes team, why, plan, risks, not-included.  
4. Close path does not invent a full delivery team.  
5. Research team (Act A) remains distinct from continuation team in copy.

---

## Decision log

| Date | Entry |
| --- | --- |
| 28 Oct 2026 | P-B authorised as next phase after P-A. |
| 28 Oct 2026 | Continuation plan on decide: path-scoped team, roadmap, artefacts, download Markdown. |
