# PSI workspace visual system

24 October 2026. The authenticated product follows the DeliverX vision: bring a product question, work with bounded specialist contributions, retain evidence and owner decisions, produce reviewable artefacts, and learn from supplied outcomes. Founders, product teams and students share this environment; career/CV features are retired.

## Design sources

The primary agent-network composition comes from the [founder-supplied HTML](design-references/deliverx-agent-network/index.html), retained unchanged. Its [README](design-references/deliverx-agent-network/README.md) records the reference's illustrative data and its differences from the canonical registry. Reference content does not override product requirements or repository instructions.

The earlier [Control AI reference](https://dribbble.com/shots/27388009-AI-Dashboard-Design-for-Control-AI-Policy-Platform) informed meaningful node relationships and inspection, but its policy-domain data and artwork are not imported. The approved public DeliverX website supplies brand, blue accents and intelligence concepts.

## Implemented workspace

- Shared product shell: Overview, Programmes, Projects, Agents & capabilities, operator-only pilot requests. Usage labels distinguish workspace, mission and programme scopes. New mission opens the existing supervised brief.
- Product overview: saved mission counts, next required decisions, exported decision packs, four selectable intelligence layers, saved mission activity and a primary brief form. The advanced specialist planner remains accessible in an expandable section. These four layers are not a mandatory linear product lifecycle.
- Agent network: a horizontal product header, left department rail, large light Product Brain canvas and persistent right specialist inspector on desktop. The old dark six-group diagram and separate directory are replaced, and their unused components removed.
- Explorer controls: search names, DX IDs, capability descriptions and allowed tools; capability-state filters; task-mission context; network/list views. Selecting a department reveals its canonical roles. Selecting a role updates the inspector. Available and planned roles have distinct styling and text labels.
- Inspector: role summary, permission/usage/runtime limits, declared input/output schema fields, actual tool allowlist, registry dependencies, known limitations and evaluation notes. Tasks, completion and upstream dependencies come from the selected task mission. Unspecified fields and missing records remain explicit. Role availability is not a performance score or proof of execution.
- Mission strip: actual task completion for a selected task mission, or the latest saved supervised decision mission and its recorded stage. No illustrative ETA or fabricated completion is imported from the HTML reference.
- Supervised mission: shared visual shell and six-step progress timeline. Evidence, approval, artefact, observed-outcome and follow-up behaviour are preserved.
- Account menu: workspace setup and sign-out remain accessible in the network layout.

## Canonical product data and authority

The registry has 150 stable DX role IDs across 15 organisational departments. Those departments are distinct from product lifecycle stages. The supplied HTML's generated 140-role roster, twelve group counts and global example-assignment toggle are not used as application data.

Catalogue lines show product-context relationships, not runtime handoff events. The network does not simulate live activity. A role's availability for planning, a task's persisted status, an owner decision and a measured product outcome remain separate signals. Existing model/simulation provenance and workspace isolation continue to apply.

The explorer does not add a direct assignment mutation. Available roles link to the existing planner. Planned and other unavailable roles cannot be assigned through this UI. Any future assignment proposal requires server-side capability/dependency/usage checks and an owner-approved versioned plan before execution.

## Responsive and accessible interaction

At desktop widths, the department rail, network and inspector share one workspace. At compact widths, the inspector moves below the graph. Narrow phones start in a searchable list view with a collapsible department rail; network view remains selectable. Nodes and controls are native keyboard-operable buttons, selection is indicated with text and styling, and reduced-motion preferences are respected. No perpetual motion suggests agents are working while idle.

## Lifecycle wheel (Phase 7a)

A product-build mission page shows its lifecycle as a wheel of twelve segments, with a list beside it that says the same thing. The twelve segments are a display mapping over the eight stored stages (`src/lib/workforce/lifecycle-wheel.ts`, version `wheel-v1`). Stored data is unchanged.

- **One home per task.** Each segment belongs to exactly one stored stage, and every task in the product-mission plan lands in exactly one segment of its own stage. Discover splits into Market, Research and Foresight. Design splits into Experience and Architecture. Release splits into Release and Publish. Each human gate sits in the segment whose work it decides. A task with a key the mapping doesn't know falls to the first segment of its stored stage, so nothing drops off the wheel. Tests check all of this against the planner. Changing where a task lands needs a new version.
- **Nothing moves unless a task did.** A segment's state comes only from its tasks: Not started, In progress, Awaiting your decision (a gate is waiting), Complete or Stopped. A segment with no tasks reads Not started. There is no animation apart from a short colour transition, which is turned off under reduced motion.
- **Every state links to its record.** Selecting a segment lists its tasks. Each task links to its row in the task graph, where gates are decided, and each artefact it produced opens in the artefact viewer.
- **Opening state.** The wheel opens on a waiting decision first. If there is none, it opens on a stopped stage, then work in progress, then the first unfinished stage.
- **Accessibility.** Segments are focusable buttons named "n. Stage: state". The arrow keys move between them, and state is given in text as well as colour. The **List** view shows the stages in order, each opening in place. On phones (up to 640px) the list replaces the wheel.

## Verification and remaining gates

TypeScript and production build pass. Lint passes with nine existing warnings. The full suite, including disposable local PostgreSQL checks, passes 192 tests with 16 environment-dependent tests skipped.

Signed-in browser checks cover department focus, ten canonical engineering nodes, DX-041 selection, search-to-inspector mapping, real tool-limit disclosure, planned-role assignment blocking, 390px mobile list/departments/search and 1440px three-column layout without horizontal overflow. The founder-supplied HTML was compared byte-for-byte after copying.

The isolated account has no task-based mission assignments. Populated running-task inspector acceptance, a full mission execution dependency graph, supervised assignment proposals, bounded provider-run evidence and durable execution/recovery remain separate roadmap/release gates. No production migration or merge is included in this UI correction.
