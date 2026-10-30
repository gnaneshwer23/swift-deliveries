# Phase P-A — Investigate entrance

**Status:** Implemented on main (founder authorised 28 Oct 2026; no paid availability)  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` (v2.1, stamped for phase planning)  
**Paid availability:** Not in scope for this phase — demonstrate without selling Investigation missions  
**Out of scope:** Act B staffing UI, Act C case room, voice/listen, 150-role catalogue, prototype builder, P-commerce enforcement

---

## Demo criterion

```text
A short idea
    ↓
Declared research scope and material clarification
    ↓
Actual research events and evidence
    ↓
Findings, counterevidence, and gaps
    ↓
One of four recommendations
    ↓
An exportable pack
    ↓
A recorded human next-path choice
```

Someone can explain: _“Here is what we know, what remains uncertain, why this recommendation follows, and what I have chosen to do next.”_

---

## In scope

| Item                       | Requirement                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Research team visibility   | Surface specialist ownership on diligence activity (who / what / kind)—not a cast parade                                                      |
| Four agent recommendations | Proceed to bounded test · Revise proposition · Pause pending evidence · Do not pursue                                                         |
| Human next path            | Authorise test · Authorise revise · Authorise gather evidence · Close case · (optional) founder-requested continuation despite recommendation |
| Disagreement               | Persist both recommendation and human path; do not erase verdict; do not imply agent endorsement of disagreement                              |
| Decision pack              | Diligence-oriented sections: findings, counterevidence, gaps, recommendation, human path, research team events                                |
| Empty retrieval            | Must not auto-map to chargeable “pause” as if evidence-based (label execution/provider gap honestly)                                          |

---

## Out of scope (explicit)

- Continuation team staffing / downloadable Act B roadmap
- Agent folders, information-flow diagram, PRD factory
- Listen / voice
- Allowance consumption / Stripe messaging for Investigation vs Continuation
- Prototype gate

---

## Acceptance checks

1. After comparison, UI shows one of four **agent** recommendations with short rationale.
2. Human can record a next-path choice that may differ; both appear in export.
3. Pack Markdown includes recommendation + next path + evidence/gaps/counterevidence.
4. Research activity lines show specialist actors (existing events).
5. Legacy missions with `accept` / `request_more_evidence` still load (normalized).

---

## Follow-on (not authorised here)

| Phase      | When                                     |
| ---------- | ---------------------------------------- |
| P-commerce | Before selling affected missions         |
| P-B        | After P-A demo accepted                  |
| P-C        | After P-B                                |
| P-D        | Listen + learner lens — not blocking P-A |

---

## Decision log

| Date        | Entry                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| 28 Oct 2026 | Phase authorised; first implementation slice is P-A only without paid availability.          |
| 28 Oct 2026 | Four-outcome recommendation + human next path + pack sections + research-team panel shipped. |
