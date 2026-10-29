# Investigation stage → decision briefing (primary Studio vision)

Founder realignment (Oct 2026): the signed-in Studio is an **investigation that becomes a decision briefing**, not an executive dispatch board, agent-card theatre, or dense indigo case tables on the foyer.

Screens map to routes:

| Screen                | Surface                   | Implementation                                                          |
| --------------------- | ------------------------- | ----------------------------------------------------------------------- |
| 1 Describe            | `/command`                | `InvestigationStudioFoyer` — one question, composer, recent cases       |
| 2 Living canvas       | `/command/supervised/$id` | `InvestigationExperience` theme clusters + event-backed handoff pulses  |
| 3 Converge            | same                      | `data-converging` when alternatives/consolidation work is on the record |
| 4 AI PM briefing      | same                      | `InvestigationPmBriefingStage` — labelled AI presenter, tabbed depth    |
| 5 Next path           | same                      | Existing human gates (`MissionTheatre` focal gate)                      |
| 6 Project room        | Inspect + phase tab       | `ProjectRoomNav`, team activity, indigo depth under **Advanced**        |
| 7 History & downloads | phase tab + Inspect       | Export honesty unchanged                                                |

## External references — borrow vs skip

### [agency-agents](https://github.com/msitarzewski/agency-agents)

| Borrow                                                                                                                                               | Skip                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Division metaphor** — small named specialist lanes (research, product, strategy) as labels on persisted tasks/handoffs, not 150 clickable personas | Personality-driven “activate Frontend Developer mode” chat theatre      |
| **Deliverable-focused roster copy** — tie visible roles to artefacts and gates on the mission record                                                 | App/install flows, markdown agent files as runtime deps                 |
| **Honest scope line** — “simple cases stay small” aligns with staffing band disclosure in approve act                                                | Fake agency chat, implied omniscience, success metrics without evidence |

No dependency added; patterns inform theme cluster labels and rail copy only.

### [threeui](https://github.com/MengTo/threeui) / `@designcodeio/threeui`

| Borrow                                                                                                                  | Skip                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Ambient connection lines** between focal nodes — reimplemented as SVG + CSS variables tied to real handoff ids        | Full Three.js scene graph, `@designcodeio/threeui` package (Stage 1 bundle cost) |
| **Restrained motion** — prefers-reduced-motion respected; decorative orbit only when `teamCollaboration.handoffs` exist | Pro/Beta catalog components, login/checkout runtime                              |
| **Theme tokens** — indigo/lavender surface stack kept from Stitch indigo doc                                            | Heavy 3D artefact previews until persisted HTML/PDF exists                       |

**Deferred:** Three.js / threeui npm dependency until a persisted 3D artefact type exists; v1 uses CSS grid clusters + SVG pulses.

## Honesty rules (unchanged)

- Pulses and theme “investigation” vs “supported” states derive from `activity`, `teamCollaboration`, `evidence`, and research fields — never timers.
- PM briefing discloses simulated draft / model id; Listen uses browser speech only.
- Indigo executive tables remain under **Advanced case dossier**, not the foyer.

## Code map

- Foyer: `investigation-studio-foyer.tsx`, `command.index.tsx`
- Stage shell: `investigation-stage-shell.tsx`, `investigation-stage-phase.ts`
- Canvas: `investigation-experience.tsx`, `investigation-experience.ts`
- Briefing: `investigation-pm-briefing-stage.tsx`
- Legacy depth: `indigo-case-studio-shell.tsx` (Advanced)
