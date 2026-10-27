# Product memory (Phase 3b)

Product memory is what the team has learned about one product (a project), kept across missions. A new mission on the same product starts from what earlier missions established. It does not start from nothing, and it does not get a blurred summary.

## What is remembered, and from where

Entries come from three places only. They are taken deterministically, without a model:

| Origin                  | Entries                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Model-written artefacts | Every labelled claim (`[Sourced fact]`, `[Assumption]`, `[Inference]`, `[Speculative]`, bullet or not) and each PRD requirement with its ID, from artefacts that passed their checks |
| Founder gate decisions  | "<gate> approved/rejected by the founder", with the note                                                                                                                             |
| Founder evidence        | The evidence title, as a **source** later missions may cite                                                                                                                          |

Some things are never remembered:

- Simulated drafts, which are placeholders.
- Artefacts that failed their checks.
- Any text that looks like it holds personal identifiers. It is screened when an entry is written and again when the entry is shown to a model.

A "sourced fact" without a `(Source: …)` is remembered only as an assumption.

## One entry per statement, with its history

An entry is matched on its kind, its statement and, for sourced facts, its source. Case, spacing and closing punctuation don't count. When a later mission states the same thing, the existing entry is marked as seen again (`times_seen`, `last_seen_at`, `last_mission_id`) and no duplicate is added. The same statement from a different source is a different fact, and both are kept.

Entries are retired, never deleted. A source is retired when the last copy of its evidence is removed from the product.

## Possibly stale

An entry is marked **possibly stale** when:

- it has not been seen for 90 days; or
- it is a sourced fact whose founder source has been withdrawn.

Stale entries are still shown, with the reason. The product memory page shows them, and so does the prompt, where missions are told to check them rather than repeat them.

## What reaches a model

- When a step runs, it gets up to 12,000 characters of memory from **earlier** missions on the same product, newest first. Each line keeps its label and source and says when it was last seen. It is given inside a `<product_memory>` block that the entries cannot close, as data, not instructions.
- Founder sources that are still current can be cited, so a sourced fact can be carried forward with its original source. Withdrawn or stale sources cannot be cited.
- The `task.completed` event records how many memory entries the model was given.

## PRD claims

PRDs now have to source or label every claim about the problem and its users. Under Problem statement and Target users, each line must start with an evidence label, and a sourced fact must cite an input the role was given. The PRD lead role's instructions moved to `DX-023@3` with this rule.

## Where to see it

**Command Centre → Projects → Product memory**, or the link on any mission page. Entries are grouped by kind, with their origin, when they were first and last seen, and any stale reason. Retired entries can be shown on request.

## Conflicting evidence (Phase 3c)

When two entries cannot both be true, the founder ticks both on the Product memory page and marks them as conflicting, with an optional note. Neither entry is changed or merged.

- Every later model step whose lead role reads product memory (see below) is shown both sides in a `CONFLICT:` line, with the note, and each entry is marked "in conflict". Roles that do not read product memory, such as UX, see neither conflicts nor resolutions.
- Conflicts come first and get up to 6,000 of the 12,000 characters, open ones before resolved ones. If more are flagged than fit, the step is told how many were left out and not to assume those entries agree. The whole memory block stays within 12,000 characters.
- A role-led step that weighs evidence (charter, market, research, PRD, evolution, release) and was shown an open conflict must say in its output that the evidence conflicts. A denial such as "no conflict" does not count. Output that doesn't is rejected, then retried once with the reason. All role instructions now say to keep both sides and never average or merge them; every role moved up one instruction version.
- Resolving a conflict records the founder's reasoning. Both entries stay, and later steps that read product memory are shown the resolution alongside them.
- A source cited by an entry shown in a conflict can be cited again, as for any other entry shown.

## What each role reads (Phase 3c)

A model step gets only the context its lead role's definition allows (`contextScopes` in `registry/roles.ts`). The mission request is always given. The other scopes are clarification answers, upstream artefacts, founder evidence and product memory.

- Research, synthesis and market roles get founder evidence; the charter, PRD and UX roles do not.
- The UX role works from the requirements only.
- A stage with no defined lead role gets everything except founder evidence.

The `task.completed` event records which scopes the model was given.

## Still to come

Approved web research. It needs a research provider and key, and runs only for a mission where the founder approves it.
