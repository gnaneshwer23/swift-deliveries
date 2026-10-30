# Phase P-commerce — Mission consumption rules (pre-paid availability)

**Status:** Shipped 28 Oct 2026  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §8 / §16  
**Paid availability:** Follow-on in [p-paid.md](./p-paid.md) (Investigation via existing checkout)  
**Depends on:** P-A (verdict + executionLimited), mission usage ceiling  
**Out of scope:** Separate Continuation SKU (later), price list changes

---

## Demo criterion

```text
Mission named as Investigation or Continuation unit
    ↓
Disclosed billable events vs free gates (approve plan, research pass)
    ↓
Hard stop when allowance would be exceeded
    ↓
Execution failure ≠ chargeable “pause” (remedy path labelled)
    ↓
Same rules in UI + decision-pack export
```

Someone can explain: _“I know what unit I’m on, what consumes allowance, what does not, and that a provider failure is not sold as diligence complete.”_

---

## In scope

| Item            | Requirement                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Units           | Investigation vs Continuation labelled on the mission                                             |
| Billable events | Options comparison when a model provider actually ran; idempotent by scope                        |
| Not billable    | Plan approval, research pass, decide, pack export, Listen, learner lens                           |
| Hard stop       | Existing usage ceiling — surface unit-aware copy when blocked                                     |
| Failure remedy  | `executionLimited` / provider gap → retry or restore credit; not a completed evidence-based pause |
| Disclosure      | Short customer-facing rules on the mission + pack section                                         |

## Honesty

- Simulated option drafts (`provider not configured`) charge **0** units.
- Paid availability remains off until founder separately authorises selling these units.
- List prices from prior docs are not re-verified or shown as live offers here.

---

## Acceptance checks

1. `commerceSnapshot(mission)` returns unit, billable events, free events, remedies.
2. Hard-stop copy names the unit and remaining allowance.
3. Execution-limited recommendation discloses remedy (not a sold pause).
4. Pack Markdown includes `## Commerce disclosure`.
5. No checkout / paid flag flipped in this phase.

---

## Decision log

| Date        | Entry                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| 28 Oct 2026 | P-commerce authorised as next after learner lens; browser Listen preferred over ElevenLabs. |
