<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## DeliverX Supervised AI Workforce (Stage 1)
Source: docs/prd-deliverx-supervised-ai-workforce.md. Gap analysis: docs/prd-gap-analysis.md.
- Signed-in primary surface is `/command` (Command Centre), not the career agent-directory workspace.
- AI drafts; humans approve plans. Act externally never runs without an explicit approval.
- Quality labels are Agent-reviewed / Automatically tested / Human-reviewed / Externally attested — never a generic “Verified”.
- Usage ceilings hard-stop further billable steps. Stage 1 uses deterministic planner/executor stubs unless model keys exist.
- New persistence uses additive `wf_*` tables with RLS workspace isolation; do not mutate legacy Delivery-OS `projects`/`tasks`/`artefacts`.
- Mission tasks form a DAG (`src/lib/workforce/graph.ts`); a task never runs on a failed, blocked or unapproved upstream — why: errors cascade through handoffs.
- Lifecycle gates are human-only: agents and the scheduler can block on a gate but never pass one.
- Every stage artefact must pass its handoff contract (`contracts.ts`) before downstream stages consume it; failures are persisted and reported, never dropped.
- Programme decisions use `src/lib/programme/deliberation.ts`: independent positions before critique, vetoes as hard rules, deterministic tally; high-impact or evidence-gap decisions always go to the founder — why: agent agreement on one model is not independent verification.
- Never fabricate customers, interviews or meetings: synthetic interviews are rehearsal-only and labelled; only founder-supplied notes count as evidence. Exports must state what is simulated in `project-manifest.json`.
- Books/publishing and regulated healthcare are out of scope for DeliverX.
- Every artefact discloses how it was produced (model id or simulated draft). Model mode is opt-in and never receives text that looks like personal identifiers.

## DeliverX Workspace (B2B) product rules
Source: docs/workspace-one-page-spec.md. These rules govern every Workspace feature.
- Objective linkage: every work item links to a business-case objective; unlinked items are flagged — why: reporting is against the case, not ticket counts.
- Human authority: AI only drafts; nothing commits without explicit human approval — why: every stage ends at a human gate.
- Frozen baseline: a frozen business case is immutable (SHA-256 checksum + version history); changes go through change requests — why: progress must be measured against a fixed reference.
- Outcome-first reporting: sponsor views lead with objective health, not velocity or burn — why: the buyer is the sponsor.
- Employee-owned evidence: observation is off by default, managers never see capability scores, records stay portable — why: Trust Rail applies to live work.
- Resource risk: an empty role slot automatically creates a risk log entry — why: capability gaps are delivery risks.
- Verifiable attribution: every metric and copilot answer cites its source record — why: no uncited claims.
- Build freeze: no Workspace app code is built until all four unfreeze criteria in roadmap.md are met — why: candidate product comes first.

## Scenario engine and Prove
- Scenario organisations are content, not code: each is one YAML file under `content/organisations/` loaded into `experience_scenarios` + `scenario_stakeholders` + `scenario_phases` + `scenario_event_cards` — why: a content author ships a new organisation in about a week with no developer.
- Shared event cards live in `event_cards` and attach to organisations via `scenario_event_cards`; candidate draws are owner-scoped in `user_event_draws` — why: events like "budget cut" are reusable across every organisation.
- Prove credentials are Open Badges 3.0 JSON in `credentials`, issued only from a confirmed `attestations` row and revoked in the same transaction as the attestation — why: Verified must have exactly one path in and one path out.
- The Open Badges issuer key lives only in server-side secrets with a documented rotation plan — why: a leaked key lets anyone forge DeliverX credentials.
