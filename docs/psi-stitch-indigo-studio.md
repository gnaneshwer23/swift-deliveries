# Stitch Indigo Studio pack

Founder **indigo Material pack** supersedes [Executive B](./psi-stitch-executive-b.md) **visual language** (primary `#3525cd`, container `#4f46e5`, surface `#faf8ff`, Plus Jakarta Sans + Inter + JetBrains Mono). Behavioural honesty rules are unchanged from AGENTS.md and Quiet Studio.

**Stitch source:** founder HTML paste (four screens). No `stitch_deliverx*` folder was present in-repo at implementation time.

## Screens mapped

| Stitch screen             | Route / surface                                   | Data binding                                                                            |
| ------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Executive dashboard       | `/command` · `ExecutiveStudioDashboard`           | Supervised home, owner inbox, investigation allowance / demo ceiling, `StudioReadiness` |
| Project briefing & vision | `/command/supervised/$id` · `#indigo-briefing`    | Brief fields, PM briefing pack, five-job pipeline from `stage`                          |
| Communication kit         | `#indigo-communication` · `CommunicationKitPanel` | Brief + evidence + claims boundary — no “100% empirically anchored”                     |
| Decisions & evidence      | `#indigo-decisions` · `DecisionsEvidenceCenter`   | `nextRequiredAction`, evidence tiers, teamCollaboration recommendation, learning chain  |
| Downloads                 | `#indigo-downloads`                               | Export buttons only when `exportBody` / artefact on record                              |

Deep inspect (team activity, full editors, outcome forms) remains under **Inspect full record** — tabs deep-link where content exists; otherwise honest empty copy.

## Tokens

Scoped to `.ps-executive` in `src/styles/psi-workspace.css`. Fonts loaded from `command-shell.tsx` when `isExecutiveStudioRoute`.

## Honesty omissions (deferred / not shipped)

- Fake confidence %, generic “Verified”, fabricated interviews/customers
- “ONLINE synthesis engine”, workspace storage %, latency ms, cryptographic seals
- “Zero Silent Automation Guaranteed” as marketing without gate enforcement
- Mock HyperFlow Sync, decorative telemetry charts, left-rail “Active Intelligence Layer ONLINE”

## Related code

| Area            | Files                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Foyer           | `executive-studio-dashboard.tsx`, `studio-intent-pills.ts`, `supervised-mission-start.tsx`                                                |
| Case shell      | `indigo-case-studio-shell.tsx`, `indigo-case-tabs.tsx`, `indigo-case-rail.tsx`, `project-briefing-banner.tsx`                             |
| Kit / decisions | `communication-kit.ts`, `communication-kit-panel.tsx`, `decisions-evidence-center.tsx`, `claims-boundary.ts`, `customer-jobs-pipeline.ts` |
| Routes          | `command.index.tsx`, `command.supervised.$missionId.tsx`, `executive-studio-routes.ts`                                                    |

See also: [Executive B](./psi-stitch-executive-b.md) (handoff sheet, superseded palette), [Quiet-first](./psi-stitch-quiet-first.md) (historical).
