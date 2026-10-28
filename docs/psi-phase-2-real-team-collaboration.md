# Phase 2 — Real team collaboration

28 October 2026. Founder-authorised slice after Phase 0 (capability / architecture baseline) and Phase 1 (reliability vertical slice).

## Scope

- Persist investigation-team **assignments**, **handoffs**, and **flow edges** on the supervised mission document (`teamCollaboration`).
- Distinguish **planned dependency** from **actual share**, **actual use**, and **resulting artefact/decision** edges.
- Small Wave-1 investigation spine only (`INVESTIGATION_TASK_KEYS` in `team-collaboration.ts`) — not the full 150-role catalogue.
- Quiet Studio **Inspect → View team activity**: structured panels backed by persisted records — no fabricated agent dialogue.
- Merge-gate proof: `team-collaboration.test.ts` traces a finding through handoffs to the stored agent recommendation.

## Out of scope (later phases)

- Phase 3 animation, Phase 4 inbox, Phase 5 export rewrite, Phase 6 release acceptance (except incidental touches).

## Verification

```sh
npm test -- src/lib/pilot-mission/team-collaboration.test.ts
npm test -- src/lib/pilot-mission
npm run build
```

Do **not** merge to `main` without founder approval — production deploys from `main` on Vercel.
