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
- New persistence uses additive `wf_*` tables with server-enforced workspace isolation; do not mutate legacy Delivery-OS `projects`/`tasks`/`artefacts`.
- Mission tasks form a DAG (`src/lib/workforce/graph.ts`); a task never runs on a failed, blocked or unapproved upstream — why: errors cascade through handoffs.
- Lifecycle gates are human-only: agents and the scheduler can block on a gate but never pass one.
- Every stage artefact must pass its handoff contract (`contracts.ts`) before downstream stages consume it; failures are persisted and reported, never dropped.
- Programme decisions use `src/lib/programme/deliberation.ts`: independent positions before critique, vetoes as hard rules, deterministic tally; high-impact or evidence-gap decisions always go to the founder — why: agent agreement on one model is not independent verification.
- Never fabricate customers, interviews or meetings: synthetic interviews are rehearsal-only and labelled; only founder-supplied notes count as evidence. Exports must state what is simulated in `project-manifest.json`.
- Books/publishing and regulated healthcare are out of scope for DeliverX.
- Every artefact discloses how it was produced (model id or simulated draft). Model mode is opt-in and never receives text that looks like personal identifiers.

## DeliverX PSI product direction
- DeliverX is an AI product company. Keep the current homepage visual foundation.
- Students learn by building products alongside agents in the same environment.
- Career readiness, job applications, CV packaging, professional credentials and coaching dashboards are retired. Historical documentation lives in docs/archive/career/ and is not current implementation guidance.
- New product work uses Neon and Neon Auth. Preserve legacy database records and migrations; do not expose legacy Supabase handlers as active product features.
- Product evidence means cited sources, artefact versions, decisions, test logs and observed outcomes. Never claim an outcome that has not been observed.
- Follow docs/psi-production-readiness-plan.md. No production readiness claim without checks on the exact release candidate.
