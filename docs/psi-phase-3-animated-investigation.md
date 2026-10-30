# Phase 3 — Animated investigation experience

Calm Quiet Studio front stage for supervised missions after plan approval: a mandala-inspired focal visual with contextual keywords and brief agent lines derived **only** from persisted `activity`, `teamCollaboration`, and research fields.

## Behaviour

- **States:** `idle`, `running`, `waiting`, `interrupted`, `complete` — from `deriveInvestigationRunState` (job lease, pause, human gates, research completion).
- **No timer-fake progress** and no fabricated dialogue; empty copy says updates appear when events land.
- **Leaving the page** does not stop execution (Phase 1 durable worker); copy states this explicitly.
- **Reduced motion:** `prefers-reduced-motion: reduce` hides the orbiting mandala and shows a static keyword list (automated test covers derivation; visual check below).

## Code

| Area               | Path                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| Derivation + tests | `src/lib/pilot-mission/investigation-experience.ts`, `*.test.ts`         |
| UI                 | `src/components/command/investigation-experience.tsx`                    |
| Quiet integration  | `src/components/command/mission-theatre.tsx` (plan-approved quiet build) |
| Styles             | `src/styles/psi-workspace.css` (`.ps-investigation-*`)                   |

Full map and pause/notify controls remain under **Map & controls** (existing Intelligence Canvas).

## Visual verification (manual)

### Desktop

1. Sign in → start or open a supervised mission → approve the specialist plan.
2. Confirm the mandala appears under the quiet status bar with state label (e.g. _running_ / _waiting_).
3. After research events persist, confirm orbit keywords and update lines match Inspect → team activity / evidence (no lines before events).
4. Open **Map & controls** — Intelligence Canvas still works; pause does not claim fake progress.

### Mobile (≤640px width)

1. Repeat steps 1–3 in a narrow viewport; mandala scales, text remains readable, gate cards still reachable below the visual.

### Reduced motion

1. Enable **Reduce motion** in OS settings (or DevTools rendering emulation).
2. Reload the mission page — orbiting mandala hidden; static keyword list shown instead; status and persisted updates unchanged.

## Automated tests

```bash
npm test -- src/lib/pilot-mission/investigation-experience.test.ts
```

Covers: idle before approval, running from leased job, keywords/updates from activity only, research line only when `researchPassCompletedAt` is set, pause → interrupted, no invented dialogue on service-backed missions.
