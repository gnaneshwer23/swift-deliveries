# Phase 4 — On-demand inspection and inbox

Calm Quiet Studio: progressive transparency with a **deduplicated in-app inbox** and **Inspect → team activity** depth backed by persisted `teamCollaboration`, evidence, and `nextRequiredAction` — no fabricated dialogue.

## Scope

- **View team activity** (enhanced Inspect): assignments, dependencies, handoffs, outputs, evidence/gaps, unresolved questions from handoff uncertainty, and the current human gate.
- **Studio inbox**: one deduplicated row per open case (`buildStudioInbox`) — gate, pause preference, and open-question counts merged without duplicate lines.
- **External email/push**: not in scope; foyer copy and honesty posture remain preference-only.
- **Reload**: inspection and inbox derive from the saved mission document (same fields after refresh).

## Out of scope

- Phase 5 export rewrite, Phase 6 release acceptance (except incidental touches).

## Code

| Area                | Path                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Inspection snapshot | `src/lib/pilot-mission/mission-inspection.ts`, `*.test.ts`                                  |
| Inbox dedupe        | `src/lib/pilot-mission/studio-inbox.ts`, `*.test.ts`                                        |
| UI                  | `team-activity-panel.tsx`, `quiet-studio-notifications.tsx`, `mission-inspection-strip.tsx` |
| Home fields         | `studioInboxFields` in `pilot-mission.functions.ts`                                         |

## Verification

```sh
npm test -- src/lib/pilot-mission/mission-inspection.test.ts src/lib/pilot-mission/studio-inbox.test.ts
npm test -- src/lib/pilot-mission/team-collaboration.test.ts
npm run build
```

Manual: open Studio → confirm **Needs you** inbox; open a case → **Inspect → View team activity** matches persisted handoffs; reload page — same record.

Do **not** merge to `main` without founder approval.
