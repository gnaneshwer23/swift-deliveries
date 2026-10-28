# Phase 5 — Briefing and downloadable record

Quiet Studio shows a **focused product briefing** when options are ready; full PM walls remain under **Inspect**.

## Shipped

- **Focused briefing** (`FocusedPmBriefing`): recommendation, supporting evidence, counterevidence, unknowns, next step — no assessment/SWOT walls in the calm view.
- **Human disagreement**: when the authorised path differs from the agent recommendation, UI and exports keep both on the record.
- **One export snapshot**: after `exportMission`, Markdown, PDF, and ZIP reuse `exportBody` / `exportPdfBase64` via `export-snapshot.ts`.
- **Downloads**: decision pack, product briefing, decision roadmap, team collaboration (when persisted), honesty manifest — linked sources not bundled.
- **Merge gate**: `phase-5-briefing-export.test.ts` (sections, snapshot parity, evidence trace, workspace isolation).

## Out of scope

- Phase 6 full release acceptance suite (except incidental export tests).
- Email / push notifications.
