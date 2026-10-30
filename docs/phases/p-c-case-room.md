# Phase P-C — Case room (Act C)

**Status:** Implemented on main (founder: “next” 28 Oct 2026; no paid availability)  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §5.4  
**Depends on:** P-A, P-B  
**Paid availability:** Not in scope  
**Out of scope:** Full live multi-agent document factory with model keys, 150-role catalogue, voice, P-commerce, unlimited PRD generation

---

## Demo criterion

```text
Continuation plan exists (P-B)
    ↓
One case room opens on the same mission (persistent case)
    ↓
Agent folders (role, responsibility, artefacts, handoffs)
    ↓
Draft role artefacts that consume upstream findings
    ↓
Information-flow diagram (who → who, what shared)
    ↓
Trace artefact → Act A evidence / decision
    ↓
Step gate visible (proceed / revise / pause / stop)
```

Someone can explain: _“I opened an agent’s folder, saw what they produced, how they used another agent’s work, and traced it back to the investigation.”_

---

## In scope

| Item            | Requirement                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| Persistent case | Same mission id; Acts A–C are views, not separate records                         |
| Agent folders   | Click agent → R&R, artefacts, inbound/outbound handoffs                           |
| Role artefacts  | Draft bodies for planned types; status planned/draft/blocked                      |
| Collaboration   | Artefacts declare `consumesArtefactIds`; handoffs have finding → request → result |
| Flow diagram    | Edges from handoffs                                                               |
| Traceability    | Artefacts cite Act A evidence ids / decision path                                 |
| Step gate       | Record human proceed/revise/pause/stop on the case (no auto-start)                |
| Close path      | Minimal room: pack + close summary only                                           |

---

## Honesty

- Draft artefacts are **AI/simulated drafts** from mission state until a later model/human review path exists.
- Labels: origin + evidence basis (not collapsed into one stamp).
- Case room **exposes** the case record — it is not the entire Product Brain.

---

## Acceptance checks

1. After decide + continuation plan, `caseRoom` is stored (except pure close may be minimal).
2. UI lists folders; selecting one shows artefacts and handoffs.
3. Flow diagram renders edges matching handoffs.
4. Selected artefact shows consumed upstream + evidence refs.
5. Human can record a step gate without starting a new mission.

---

## Decision log

| Date        | Entry                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| 28 Oct 2026 | P-C authorised after P-B.                                               |
| 28 Oct 2026 | Case room: folders, draft artefacts, handoffs, flow diagram, step gate. |
