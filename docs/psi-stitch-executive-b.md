# Stitch Executive B (Studio foyer)

Founder choice **B** supersedes **A (Quiet-first)** for the signed-in Studio **foyer** (`/command`). Portfolio and Advanced routes keep the same Stitch **Executive Autonomous Dispatch** tokens; the foyer is now an executive dispatch board instead of the calm Quiet-only line.

**Stitch source (reference):** `stitch_deliverx_project_dashboard (1)/DESIGN.md`, `code.html` (Specialist Handoff & Trace sheet — adapted without mock telemetry).

## What shipped

### Design tokens

- `.ps-executive` now applies on **`/command`** as well as Portfolio, Advanced, and mission dossiers (`isExecutiveStudioRoute`).
- Token refresh toward the newer pack: canvas `#f8f9ff`, ink `#0b1c30`, container wells `#eff4ff` / `#e5eeff`, mono kickers unchanged (JetBrains Mono).

### Executive foyer (`/command`)

- **`ExecutiveStudioDashboard`**: omnibox (existing supervised start), **Needs your attention** (workforce owner inbox + supervised gates + deduplicated studio inbox), **Running on record** (`jobStatus === "leased"`, research pass queued), searchable **Cases** list (recent open missions).
- No mock interview counts, competitor intel, SLA latency, or “verified & sealed” badges.

### Specialist Handoff & Trace

- **`SpecialistHandoffTraceSheet`**: bottom sheet opened from **Inspect → team activity → Inspect handoff & trace**.
- Tabs bind to persisted `teamCollaboration` / mission evidence / inspection outputs. **Governance** tab only when approval, recommendation, or observation exists; explicit note that crypto/Merkle/latency are not stored.
- Copy JSON exports the handoff payload only — not fabricated trace ids.

### Quiet A remnants

- `WorkspaceFoyer` remains in the codebase for reference; `/command` no longer mounts it.
- Mission theatre and downloads depth unchanged; PM briefing wall not on the foyer.

## How to review

1. Sign in → **`/command`** — executive typography, attention cards, running strip (if any leased jobs), case search.
2. Open a supervised case → **Inspect full record → View team activity** → **Inspect handoff & trace** on a persisted handoff.
3. **`/command/portfolio`** — still the full filterable portfolio (foyer links through).

## Related code

| Area | Files |
|------|--------|
| Route gating + fonts | `src/lib/command/executive-studio-routes.ts`, `src/components/command/command-shell.tsx` |
| Tokens | `src/styles/psi-workspace.css` (`.ps-executive`) |
| Foyer B | `src/components/command/executive-studio-dashboard.tsx`, `src/routes/_authenticated/command.index.tsx` |
| Handoff sheet | `src/components/command/specialist-handoff-trace-sheet.tsx`, `src/components/command/team-activity-panel.tsx` |

See also: `docs/psi-stitch-quiet-first.md` (historical A scope).
