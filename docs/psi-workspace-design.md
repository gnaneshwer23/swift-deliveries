# PSI workspace visual system

24 October 2026. Extends the approved public website's white, ink and blue design language into the authenticated product.

## Direction

Reference: https://dribbble.com/shots/27388009-AI-Dashboard-Design-for-Control-AI-Policy-Platform . Adapt its meaningful node relationships and detail inspector to the DeliverX product lifecycle; do not reproduce its artwork or policy-domain data.

Palette: canvas `#F7F8FC`, surface `#FFFFFF`, ink `#182230`, blue `#4567EC`, network `#10151F`, muted text `#667085`. Existing Inter typography; 27px page titles, 16–20px panel headings, compact secondary data. Quiet light navigation around a single dark workforce map. Network nodes are clickable code-native visuals, not static image assets.

## Surfaces

- Shared shell: Overview, Programmes, Projects, Agents & capabilities, operator-only pilot requests. New mission links to the existing supervised brief. Mobile/compact navigation, keyboard focus, escape dismissal and reduced-motion styles.
- Overview: summaries of saved records, four selectable lifecycle layers, supervised mission activity with stage indicators, a primary brief form. Advanced planning stays accessible in an expandable section. Existing task-based mission ledger remains available.
- Agents: all 150 registry roles grouped into six contribution clusters spanning all 15 departments. Each small mark represents a catalogue role; available foundations have a different colour. Selection explains a group's outputs and filters its roles. Search, lifecycle/department filters, bounded role list, incremental loading and a role inspector preserve limitations, permission ceilings and evaluation notes.
- Involvement: selected task-based mission's assigned specialist names, completed/assigned task counts, task status, named dependencies and human gates. Refreshes every 15 seconds only while the selected mission is running. No synthetic task data is introduced.
- Supervised mission: shared visual shell and six-step progress timeline; decision, evidence, artefact, outcome and approval behaviour preserved.
- Projects, programmes and mission pages inherit the shared shell and form/panel styling; existing workflows and permissions are retained.

## Data boundaries

The architecture map illustrates contribution relationships, not a live orchestration graph. Available means registry availability, not an independently deployed agent or model. The current account's supervised decision brief does not create task-based specialist assignments. Model configuration remains explicit. Completion does not establish an observed product outcome. Summary counts are bounded by the records returned by the existing APIs, not all-time analytics.

## Verification

TypeScript, production build and lint passed (nine pre-existing lint warnings). Full suite including disposable local PostgreSQL: 192 passed, 16 skipped. Signed-in browser checks: role selection, group filtering, search/inspector matching, lifecycle selection, new-mission anchor navigation, compact menu and overflow. The isolated account currently has no task-based assignments; the non-empty involvement UI is wired to typed mission records but has not been visually accepted with a live running mission. No production database changes or customer records were required for this redesign.

## Visual refinement before push

Replaced the central icon with an original layered Product Brain SVG, added role-specific symbols and named specialist cards, and refined depth, focus and selection styling. Added an explicitly labelled six-step handoff example with named registry specialists, an owner decision gate, input/output relationships, selectable artefact previews and wrapped-row connector paths. No example steps execute work. Selecting a specialist opens the actual registry inspector. The involvement panel now surfaces the account's saved supervised decision missions where no task-based assignments exist, without presenting them as agent execution.

Browser checks verified the decision gate explanation, architecture-specialist drill-down to DX-041, a single matching registry result, one real saved decision record and no horizontal overflow in the current compact viewport. Production build, TypeScript and lint pass (nine pre-existing warnings). Refinement was reviewed locally before inclusion in this candidate. Production release acceptance remains separate.

## Vision alignment for the pushed candidate

- The dashboard follows Evidence & memory → Judgement → Delivery → Feedback from the approved marketing direction. These are selectable intelligence layers, not a claim that every mission must execute the full lifecycle.
- Product-building and learning share one workspace. No career, CV, recruitment or credential features were added.
- The explorer uses the canonical 150 DX role records and 15 organisational departments. Six visual contribution groups cover those departments; they do not replace the registry or claim to be the 12 product lifecycle stages. The supplied prototype's alternate 140-role roster and illustrative completion/ETA were not imported.
- Availability is described as availability for planning. Mission task states, generation provenance, owner approval, exported artefacts and observed outcomes retain separate meanings.
- Shared usage labels now distinguish workspace, mission and programme allowances. A failed activity query displays unavailable summary counts rather than zero activity.
- Customer copy describes specialist planning and approvals rather than earlier implementation history or database migrations. Planned capabilities and unavailable product builds remain explicit.
- Agent assignment proposals, a full three-pane mission dependency explorer, provider-run proof and durable execution/recovery are still roadmap work; this visual release does not claim those milestones are complete.

Candidate verification: TypeScript and production build passed; the full suite passed 192 tests with 16 environment-dependent tests skipped; lint passed with nine existing warnings. No production migration, role-catalogue replacement or merge is part of this change.
