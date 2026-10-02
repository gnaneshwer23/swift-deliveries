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
