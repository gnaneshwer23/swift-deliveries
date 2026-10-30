# PSI audit gaps — closed vs still blocked

**Branch:** `fix/audit-gaps` (28 Oct 2026)  
**Audit source:** `docs/psi-phases-and-dashboards-audit.md`

## Closed in this pass

| Gap                                     | What shipped                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Main CI lint**                        | PR **#55** merged — Prettier/lint baseline green on `main`.                                                                                                                                                                                                                                                                                                  |
| **Audit documentation**                 | PR **#56** — phases/dashboards founder audit doc (merge when CI green).                                                                                                                                                                                                                                                                                      |
| **Quiet Studio shell nav**              | Primary nav: **Studio + Portfolio** only; **Projects, Agents office, Specialists, Programmes** under **Advanced**; mission usage meter de-emphasised on foyer (`foyerMode`).                                                                                                                                                                                 |
| **Durable research pass (Q0 partial)**  | Plan approval persists **`researchPassQueuedAt`** with activity `research.pass.queued`. Pass runs via **`runQueuedResearchPass`** (lease + `research-pass` job key) on mission reload, **`/api/worker/tick`** drain, or inline when tests omit `deferResearchPass`. Production **`approveSupervisedPlan`** defers pass (not browser-coupled for completion). |
| **Intake attachments (honest minimal)** | Optional **text paste** at intake → supplied evidence row (`Founder intake paste…`); no file upload/OCR.                                                                                                                                                                                                                                                     |
| **Notify / Watchtower clarity**         | Foyer inbox shows **detail lines**; **research queued** signal in studio inbox; existing Watchtower panel honesty unchanged (no fake runner/email).                                                                                                                                                                                                          |
| **Phase 0 docs**                        | PR **#49** — Q0 contract on branch `docs/quiet-investigation-phase-0` (merge after rebase if still open).                                                                                                                                                                                                                                                    |

## Residual limits (documented, not faked)

| Topic                                          | Status                                                                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Worker tick schedule**                       | `drainQueuedResearchPasses` runs when **`CRON_SECRET`** tick fires; **`vercel.json` cron** may still be unset — passes also complete on **mission reload** (`getSupervisedMission`). |
| **Live search providers**                      | Tavily/Exa/Brave smoke needs budget/keys — unchanged.                                                                                                                                |
| **Stripe live / `PSI_PAYMENTS_LIVE_APPROVED`** | Out of scope — simulated paths only.                                                                                                                                                 |
| **Neon Auth E2E on Vercel**                    | Env-dependent — see `docs/neon-auth-local-setup.md`.                                                                                                                                 |
| **Email/push / 24×7 Watchtower runner**        | Preferences + in-app inbox only; `lastSuccessfulCheckAt` / `nextScheduledCheckAt` stay empty until a real runner exists.                                                             |
| **Production certification**                   | Phase 6 fixture acceptance unchanged — not a production promo.                                                                                                                       |

## How to verify locally

1. Env: `VITE_NEON_AUTH_URL`, `DATABASE_URL` (see neon auth doc).
2. **Quiet Studio nav:** Sign in → `/command` — sidebar shows Studio/Portfolio; Advanced fold holds workforce links.
3. **Research queue:** Start case → approve plan → briefly see queued state → reload mission or wait for worker tick → `researchPassCompletedAt` set.
4. **Intake paste:** Optional evidence textarea under intake “Optional details” → start case → Inspect evidence register includes founder paste row.
5. **Checks:** `npm run lint`, `npx tsc --noEmit`, `npx vitest run src/lib/pilot-mission/service.test.ts src/lib/pilot-mission/studio-inbox.test.ts`, `npm run build`.
