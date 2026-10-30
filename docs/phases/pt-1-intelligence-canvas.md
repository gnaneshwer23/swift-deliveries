# Phase PT-1 — Intelligence Canvas + PM briefing polish

**Status:** Authorised and shipping (founder: “build” 28 Oct 2026)  
**Parent:** `docs/business-case-deliverx-psi-v2.2-progressive-transparency.md` (stamped with this phase)  
**Depends on:** P-A (verdict, research events), mission theatre  
**Paid availability:** Unchanged  
**Out of scope:** React Flow dependency, Watchtower, portfolio centre, cartoon office agents, fake interview theatre, invented progress %

---

## Demo criterion

```text
Plan approved → investigation in progress
    ↓
Event-backed Intelligence Canvas (nodes from real evidence/activity)
    ↓
Plain-language status; leave-and-return honesty
    ↓
When options ready → PM briefing with separated assessments + actionable SWOT
    ↓
Four-outcome recommendation remains the path gate
```

Someone can explain: _“I saw a calm map of the investigation tied to real findings, left the page safely, and got a briefing that separates buildability from desirability.”_

---

## In scope

| Item          | Requirement                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Canvas        | Derived nodes: idea, market, alternatives, needs, risks, assumptions, evidence — state from mission record       |
| Event backing | Active/settled/blocked/review only from evidence, activity, tasks, or proposal — no decorative “fake work” edges |
| Status line   | One plain-language update; no invented % or countdown                                                            |
| Leave/return  | Explicit: research continues; you can leave this page                                                            |
| Briefing      | Feasibility · demand · proposition · next-investment as separate fields                                          |
| SWOT          | Each item: statement · basis · implication · next question                                                       |
| Controls      | Inspect activity (link/anchor); cancel already exists; notify deferred if no push infra                          |

---

## Acceptance checks

1. `buildIntelligenceCanvas(mission)` returns nodes whose `eventBasis` cites real ids/kinds.
2. Empty/new mission canvas does not invent competitor interviews.
3. `buildPmBriefingPack(mission)` separates four assessment dimensions + SWOT with basis.
4. Work act shows canvas; after proposal, briefing panel appears.
5. No React Flow package added.

---

## Decision log

| Date        | Entry                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| 28 Oct 2026 | Founder “build” after v2.2 progressive-transparency recording → PT-1 authorised. |
