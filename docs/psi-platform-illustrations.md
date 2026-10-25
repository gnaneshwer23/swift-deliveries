# Platform illustrations and homepage story

The homepage tells one story with no repeated concept. Each chapter owns one idea and one illustration, drawn in code from `src/components/illustrations/` (isometric SVG: glass vessels on rounded pedestals, agent figures, icon chips, glowing links on a dark navy stage).

| Section | Concept it owns | Illustration | Data source |
| --- | --- | --- | --- |
| Hero · Product Brain | The whole loop at a glance: evidence → judgement → delivery → observed feedback | Three tiers rising as a staircase, linked by conduits; a feedback arc returns to evidence | Existing explorer state machine (`product-brain-explorer.tsx`) |
| 01 Specialists | 150 catalogue roles; a mission assembles only the ones it needs | 15 department pedestals; departments on the mission hold vessels with their agents | `lib/marketing/workforce-summary.ts`, tested against the capability registry |
| 02 Decisions | Independent positions, critique, vetoes, 60% weighted supermajority, human ratification | One vessel per option, one figure per vote, support bars with the threshold | `lib/marketing/sample-deliberation.ts`, tested against `programme/deliberation.ts` |
| 03 Build record | Ask how a product was built and get the whole pathway | Seven pedestals from prompt to release; each step shows who, used, decided, left open, how produced | Sample record, labelled; respects quality labels and simulated-draft disclosure |
| 04 Your control | Permission ladder, usage ceiling, human-only gates | Rising steps with "act externally" locked; a vessel filling toward a ceiling ring | Product rules in `AGENTS.md` |
| 05 Learn by building | Students build beside the agents; contributions are recorded | A builder on a central pedestal with specialists around | — |
| Close | Start from one sentence | Prompt bar → saves a brief → `/onboarding` | `lib/pilot/storage.ts` |

Rules kept by the copy and art: catalogue roles are never shown as live (12 available, 138 in development); sample data is labelled as sample; outcomes are only those the owner supplies; quality labels never say "verified".

## Onboarding and dashboard

- **Onboarding** (`components/onboarding/onboarding-stage.tsx`): the left panel follows the three setup steps — you at the centre, the typical starting team for the chosen goal (from the registry intent map, labelled as typical; the real plan is proposed and approved later), and the first step of the build record carrying the user's question.
- **Command Centre** (`components/command/mission-pipeline-stage.tsx`): recent missions grouped by status into vessels (waiting for you, in progress, in review, delivered, stopped), workspace usage against its ceiling, and a link to the decisions waiting on the user. All counts come from the bootstrap query.
