# DeliverX Workspace — One-Page Spec

Oct 2, 2026 · @Gnaneshwer Jadav

## The bet

Workspace turns an approved business case into a team, a plan and a weekly delivery loop, and reports progress against the case's objectives instead of ticket counts. It is the layer between the business case and the backlog, not another task tracker.

**Buyer:** the sponsor or head of delivery (COO, PMO lead, transformation director) in organisations running 5 to 30 change projects a year. Start in healthcare and education, where the founder already has domain access through Aksh Health and Fluent Institute.

**Daily user:** the delivery lead. Contributors join free.

**Why it wins:** existing tools track tasks well and benefits badly. Nobody connects "what the sponsor approved" to "what the team did this week" to "what each person demonstrated". That last link is the moat: delivery work becomes portable, consented evidence in each team member's Professional Intelligence record.

**Positioning call:** do not compete on task management. Own the case, the objectives, the decisions, the risks and the sponsor view. Keep tasks minimal in v1 and sync to Jira or Linear in v2, because engineers will not move.

## Unfreeze criteria

No Workspace build starts until all four are true. Building two products at once with one committer is how both stall.

- [ ] Candidate pilot: at least 5 of 10 users completed the core loop and at least 3 external attestations exist
- [ ] One design partner committed: a real team, a real business case, a named sponsor, 8 weeks (Fluent Institute is the first ask)
- [ ] Candidate product is in maintenance mode, with no open P0 or P1 issues
- [ ] Decision-log entry amends the Build Charter to make Workspace a product, not an alias

## Core workflow

Teams form from the capabilities the case needs, not from a list of names, and every stage ends at a human gate.

&#91;embedded content: Workspace flow · business case to evidence, 6 stages\]

Stage 5 repeats weekly until the sponsor closes the project; a rejected draft goes back to the AI with the reviewer's edits.

## v1 scope

v1 ships four roles, not seven: Sponsor, Delivery lead, BA and Contributor. Engineers, QA and designers share the Contributor view with a role tag. Separate scrum, QA and product dashboards wait for evidence that teams need them.

| In v1 | Out of v1 |
| --- | --- |
| Business case upload (PDF, Word) and structuring | Gantt charts, resource levelling, timesheets |
| Baseline freeze with checksum and version history | Portfolio or programme views across many projects |
| Capability needs per workstream; role slots and invites | Seven role-specific dashboards |
| Objective-linked work items (minimal tasks) | Replacing Jira or Linear (sync in v2) |
| Meeting notes or recording upload, with an approval queue for actions, decisions and risks | Auto-joining meeting bot |
| Change requests with impact shown against the baseline | Delivery Brain playbook auto-builder (v2) |
| Sponsor view: objective health plus a copilot that answers questions with citations | Marketplace, native mobile, multi-language |
| Close: benefits check, lessons, consented evidence export | Individual performance scoring of any kind |

**Reuse from the repo, don't rebuild:** `business-case`, `ba-clarification-queue`, `workspace-flow-invites`, `meeting-flow` and `meeting-review`, the `/project/[id]/traceability` graph, the approval queues, `evidence-ledger` and `workspace-observation` (consent default off).

## Product rules

These seven rules are what make this DeliverX rather than Jira with a chatbot. A feature that breaks one is redesigned or dropped.

1. **Every work item names the objective it serves.** Items with no objective are flagged, not hidden.
2. **AI drafts, humans decide.** Nothing reaches a team member until a named person approves it.
3. **The baseline is frozen.** Scope, cost or timeline changes go through a change request that shows the effect on objectives.
4. **Report outcomes, not activity.** The sponsor view leads with objective health; task counts sit underneath.
5. **Evidence belongs to the employee.** Observation is off by default. Managers can confirm contributions but never see a capability score. Records leave with the person.
6. **An empty role slot is a risk.** It appears in the risk log automatically.
7. **No number without a source.** Every metric and every copilot answer cites the case text, meeting or record it came from.

## Pilot metrics and kill signals

The design-partner pilot runs 8 weeks with 1 to 3 teams. Success means the sponsor uses it unprompted and the partner agrees to pay.

| Metric | Target | Kill or rethink signal |
| --- | --- | --- |
| Case upload to approved baseline | Under 2 working days | Baseline still unapproved after 1 week |
| Team mobilised (slots filled, starting packs opened) | Within 1 week of baseline | Slots still empty in week 3 |
| AI drafts accepted, with or without edits | 60% or more | Under 40% after week 4 |
| Weeks with meetings processed and approvals cleared within 48 hours | 75% or more | Team keeps a parallel tracker as its real source of truth |
| Sponsor opens the sponsor view unprompted | At least weekly | Not opened in 3 of the first 4 weeks |
| Active work items linked to an objective | 90% or more | Under 60% |
| Team members opting in to evidence capture | 50% or more | Under 20% means the evidence pitch is wrong for teams |
| Partner agrees to paid continuation | Yes, at week 8 | No, or "only if free" |

If the team keeps working in another tracker, pivot v2 to an objective layer that sits on top of Jira rather than a workspace that replaces it.

## Pricing, risks and open questions

**Pricing hypothesis:** charge per active project, around £750 a month, with contributors free. The sponsor buys a project outcome, not seats. Free contributors remove adoption friction, and each one is a new Professional Intelligence user, which feeds the candidate product. Test the number with the design partner; it is a hypothesis, not a decision.

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Employer pays, employee owns the evidence | Buyer and beneficiary want different things | Consent default off; no manager-visible scores; evidence leaves with the person |
| Teams won't leave Jira | Workspace becomes a second place to update | Minimal tasks in v1; Jira or Linear sync in v2 |
| AI misreads the business case | Wrong baseline, wrong plan | Every extracted item cites its source text; sponsor approves the baseline |
| Founder bandwidth | Two products with one committer stall both | Unfreeze criteria above |
| Business cases are sensitive | Procurement and security reviews block sales | UK or EU hosting, no model training on customer data, a data processing agreement ready before the first call |

**Open questions**

- [ ] Is Fluent Institute the first design partner, and which project?
- [ ] Jira or Linear sync in v1 or v2?
- [ ] Private sector first, or accept public-sector procurement timelines for healthcare and education?
- [ ] Does the first partner need single sign-on?
