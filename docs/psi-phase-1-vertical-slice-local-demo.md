# PSI Phase 1 vertical slice — local review and demo

**Purpose:** Manual walkthrough of Idea → briefing → path → export on a developer machine.  
**Not:** Production smoke, billing, or live provider proof.

---

## Prerequisites

1. Clone `https://github.com/gnaneshwer23/swift-deliveries` and checkout `main` at or after `904838ec06335dec4bf642ff4d2a16f815f67e4c`.
2. Install dependencies: `npm install`.
3. Configure env (see `.env.example` or project docs) at minimum:
   - Neon database URL and applied migrations including supervised missions table
   - Neon Auth (or project-supported auth) so `/command` is reachable signed-in
4. Start dev server: `npm run dev` (default Vite/TanStack Start port from console output).

Optional: set a research provider key to observe cited web lines — still subject to plan approval and allowance rules.

---

## Demo script (~15 minutes)

### 1. Idea and commitment (A)

1. Sign in and open **`/command`**.
2. Enter a one-liner (e.g. “Should we add weekday grab-and-go breakfast at a Bath café?”).
3. Confirm **interpretation** and **commitment** block: scope, sources, limits, Investigation allowance line, attachments deferred note.
4. Start the supervised case → land on **`/command/supervised/{id}`**.

### 2. Plan gate and investigation (B)

1. Review specialist plan; **approve** only when ready.
2. Observe **Intelligence Canvas**: nodes should activate from real activity, not cartoon interviews.
3. Use **Continue in background** / leave and return — status should still reflect durable mission state after reload (requires DB).
4. Toggle **Notify when ready** — confirm copy states delivery is not active.

### 3. Canvas and briefing (C, E)

1. After options exist, open **PM briefing**: four assessments, recommendation, counterevidence, SWOT with basis.
2. Optional: **Listen** — should use browser speech only (no claim of cloud voice unless separately configured).

### 4. Decision (D, F)

1. Note **agent recommendation** (one of four outcomes).
2. Choose a **human path** — try one that **disagrees** (e.g. founder-requested continuation).
3. Confirm recommendation remains on record in briefing/export/learner lens.

### 5. Persistence and export (G)

1. Open **`/command/portfolio`** — case appears with stage and attention hints.
2. Open **`/command/projects`** if the case is linked to a product shelf.
3. Prepare and **download decision pack** (Markdown + PDF) from the supervised mission.
4. Optional: executive pack vs full archive downloads (PT-3) after pack prepared.

---

## Automated check (before demo)

```bash
npm test
npm test -- src/lib/pilot-mission
```

Both should pass locally.

---

## What to flag during review

- Any control that implies email/push/watchtower runs without the honesty disclaimer
- Generic “Verified” instead of assurance labels
- Interview language without rehearsal/recruitment labelling
- Export missing honesty section or Act A recommendation vs human path

---

## Rollback during demo

- Cancel mission from canvas control — export should refuse with cancelled state.
- Discard local env changes; do not run destructive migrations.
