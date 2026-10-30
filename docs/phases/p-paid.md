# Phase P-paid — Investigation paid availability

**Status:** Shipping (founder: “go ahead with the next steps” 28 Oct 2026)  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §8 / §16 (after P-commerce)  
**Depends on:** P-commerce disclosure + existing PSI Stripe checkout / `psi_pilot_activations`  
**Paid availability:** Investigation units may be sold via existing Builder / Founder / Studio checkout when checkout flags are on  
**Out of scope:** Separate Continuation SKU, new list prices, forcing every workspace to pay before demo, career plans

---

## Demo criterion

```text
Pricing names Investigation missions (Acts A + pack + next-step outline)
    ↓
Continuation called out as separately scoped (not implied by Proceed)
    ↓
Commerce remedies + hard-stop disclosed beside offers
    ↓
Activated workspace: exhausted mission allowance blocks a new Investigation start
    ↓
Checkout flags unchanged — sandbox/live still require existing payment env
```

Someone can explain: _“I buy Investigation capacity; Continuation is not automatic; when my allowance is used I cannot start another Investigation.”_

---

## In scope

| Item                 | Requirement                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit on pricing      | Monthly “missions” = Investigation missions                                                                |
| Continuation honesty | Not included as unlimited Act C; separately scoped                                                         |
| Commerce link        | Pricing + Studio surface P-commerce remedies / hard-stop                                                   |
| Start gate           | If `psi_pilot_activations` remaining ≤ 0 → refuse `startSupervisedMission`                                 |
| Demo workspaces      | No activation → start still allowed under workspace usage ceiling                                          |
| Consumption          | Existing reservation: billable comparison consumes one pilot mission when provider runs; simulated refunds |

## Honesty

- Checkout still gated by `VITE_PAYMENTS_CHECKOUT_ENABLED` and payments mode.
- This phase does not invent new Stripe prices.
- Manual activation without payment remains labelled (`paymentTaken: false`).

---

## Acceptance checks

1. Pricing FAQ / offers mention Investigation vs Continuation.
2. Exhausted activation blocks new Investigation create with a clear message.
3. Workspace without activation can still start a demo mission.
4. Studio chip says Investigations remaining when activated.
5. No new price IDs or kill-switch bypass.

---

## Decision log

| Date        | Entry                                                        |
| ----------- | ------------------------------------------------------------ |
| 28 Oct 2026 | Authorised after P-commerce disclosure; browser Listen kept. |
