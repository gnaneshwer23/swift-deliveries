# Phase P-D — Listen + learner lens

**Status:** Listen + learner lens shipped (founder: browser voice preferred 28 Oct 2026; no paid availability)  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §4 / §16 P-D  
**Paid availability:** Not in scope  
**Out of scope:** Separate student product, career/CV surfaces, execution blockers disguised as teaching, agent-activity dashboards as “learning”, cloud TTS spend

---

## Listen (shipped — browser speech)

| Item       | Behaviour                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| Same words | `pmBriefListenScript` matches on-screen PM brief                                          |
| Provider   | Browser `speechSynthesis` only (device voice; no cloud charge)                            |
| Cloud TTS  | Off by product choice — ElevenLabs helpers remain experimental / unused by product Listen |
| UI         | Listen / Stop on briefing + approve acts                                                  |
| Safety     | Listen never approves or mutates a mission                                                |

---

## Learner lens (this slice)

**Demo criterion**

```text
Same supervised mission spine
    ↓
Derived summary of *your* contributions (brief, approvals, path, notes, gates, outcomes)
    ↓
Judgement moments (agree / disagree / outcome reading) — recommendation stays on record
    ↓
Optional reflection prompts (never block execution)
    ↓
Same fields in the decision-pack export
```

Someone can explain: _“Here is what I contributed and how I judged—not how busy the agents were.”_

### In scope

| Item               | Requirement                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same spine         | No separate learner product; panel on the supervised mission                                                                                      |
| Your contributions | Human acts only: case statement, plan approval, next path, decision note, case gate, expectation, observation, review reading, follow-up approval |
| Judgements         | Stance vs agent recommendation; case step gate; outcome reading — disagreement never erases the verdict                                           |
| Honesty            | Explicitly **not** agent activity volume or task-event counts                                                                                     |
| Prompts            | Short reflection prompts; `blocking: false` always — teaching ≠ execution gate                                                                    |
| Export             | Decision pack includes a Learner lens section                                                                                                     |

### Out of scope

- Scoring / grades / “learning progress %”
- Counting specialist events as learning proof
- Auto-starting missions from prompts
- Career packaging

---

## Acceptance checks

1. After any human decision on a mission, `buildLearnerSummary(mission)` lists that contribution.
2. Disagreement appears as a judgement with the recommendation still named.
3. UI panel does not show agent activity volume.
4. Prompts never disable Compare / Decide / Export.
5. Pack Markdown includes `## Learner lens`.

---

## Decision log

| Date        | Entry                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------- |
| 28 Oct 2026 | Founder supplied ElevenLabs voice id `Aa6nEBJJMKJwJkCx8VU2`. Listen wired with browser fallback.    |
| 28 Oct 2026 | Learner lens authorised as next step after Listen + verdict fix demo.                               |
| 28 Oct 2026 | Founder: prefer browser speech; ElevenLabs too expensive. Product Listen no longer calls cloud TTS. |
