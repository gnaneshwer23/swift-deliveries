# Stitch Quiet-first adoption (DeliverX Studio)

Founder choice **A (Quiet-first)** — **superseded for the foyer by [Executive B](./psi-stitch-executive-b.md)**. Historically: keep `/command` as the Quiet Studio foyer; borrow Stitch only on Portfolio, Advanced routes, and mission dossiers.

**Stitch source (reference):** `stitch_deliverx_project_dashboard/executive_autonomous_dispatch/DESIGN.md` and `deliverx_dashboard/code.html` (not copied wholesale).

## What shipped

### Phase 1 — Design tokens

- Scoped class **`ps-executive`** on `CommandShell` when the route is Portfolio, Projects, Capabilities, Programmes, supervised/mission dossiers, or product memory (`isExecutiveStudioRoute` in `command-shell.tsx`).
- CSS variables and primitives in `src/styles/psi-workspace.css`: executive cards, mono section kickers, status chips, filter well, count badge.
- **Hanken Grotesk** + **JetBrains Mono** load via a single stylesheet link injected only while an executive route is mounted — marketing homepage and Quiet foyer fonts unchanged.

### Phase 2 — Dashboard slice (real data)

- **`/command/portfolio`**: foyer-style stage header; **Needs your attention** from workforce owner inbox + supervised home missions with attention `nextId`; searchable/filterable case list in executive cards (stage, next action, monitoring text from server).
- **`/command/projects`**: same kickers/chips on quiet shelf rows; stage/next from project shelf; chip on first mission that needs owner action (`nextActionId` on shelf rows).

### Explicitly deferred

- Mobile bottom nav, full PM briefing wall on Studio foyer, mock telemetry / competitor intel / audio omnibox, fabricated portfolio intelligence.

## Honesty & gates

- No generic “Verified”; existing honesty badges and inbox copy unchanged.
- Attention chips reflect `nextRequiredAction` / owner inbox rows only — not inferred SLA or agent counts.

## How to review locally

1. Sign in and open **`/command/portfolio`** — confirm executive typography, attention cards (if any open cases), filters, and case cards.
2. Open **`/command/projects`** — confirm quiet rows + manage drawer; chips when a shelf mission needs you.
3. Open **`/command`** — confirm foyer is **not** re-skinned as the Stitch dashboard (no `ps-executive` on shell).

## Related code

| Area                 | Files                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| Route gating + fonts | `src/components/command/command-shell.tsx`                              |
| Tokens               | `src/styles/psi-workspace.css` (`.ps-executive`)                        |
| Portfolio UI         | `src/routes/_authenticated/command.portfolio.tsx`                       |
| Projects UI          | `src/routes/_authenticated/command.projects.tsx`                        |
| Attention helpers    | `src/lib/pilot-mission/portfolio.ts`, `build-beats.ts` (`nextActionId`) |
