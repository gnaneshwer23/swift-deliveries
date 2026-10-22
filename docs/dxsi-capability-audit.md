# DXSI capability audit — vision vs repository

**Date:** 22 Oct 2026 · **Vision:** "DeliverX Super Intelligence: From an Idea to a Real, Working Product" (14 sections).
**Scope rule:** general-purpose product building. Books/publishing and regulated healthcare are out of scope; clinical requests are disclosed as out of scope by `isRegulatedDomainRequest`.

Legend: **Exists** = working in this repo with tests · **Extend** = foundation exists, needs more · **New** = not started.

## 1. Section-by-section

| Vision requirement | Status | Where | What's left |
| --- | --- | --- | --- |
| §1 Five founder questions answerable at any moment | **Exists** | `FounderBriefing` on `/command/programmes/$id` — derived only from persisted state | — |
| §2 Virtual company, not a directory; offices over 150 roles | **Extend** | 15 departments × 10 roles (`registry/data.ts`); each work item staffs a team; all 150 have a defined seat (`blueprint.ts`, test-enforced) | Group departments into the six offices in the UI; dynamic team sizing by complexity (today the blueprint is fixed per programme) |
| §2 Agents can't approve their own risky work or override decisions | **Exists** | Gates are human-only; peer reviewer is always another department; decisions are append-only | — |
| §3 Lifecycle 01–10 | **Extend** | Programme phases: discovery → definition → design → build sprints → verification → launch → growth; 35+ work items | Stage 01 multi-format intake (voice, documents, sketches); scaling the process to risk/complexity (lightweight track) |
| §3 Real artefacts | **Extend** | Contracted deliverables; model mode is opt-in (`DXSI_MODEL_ENABLED`) | Simulated mode produces labelled templates — model mode must be enabled for substantive content |
| §3/07 Engineering produces working software | **New** | Sandboxed HTML prototype only | Isolated code workspaces (Vercel Sandbox or similar), Git branches, code review, real tests |
| §4 Decision protocol: frame → independent → challenge → reconcile → evaluate → record → verify | **Exists** (1–6), **Extend** (7) | `deliberation.ts`: independent positions via department lenses, red-team challenge (DX-004), bounded persuasion with attribution, vetoes, weighted supermajority, sensitivity analysis, review condition, dissent | Step 7: link each decision to follow-up tasks and verify the expected outcome later |
| §4 Decision tiers (low/cross-functional/high/irreversible/evidence gap) | **Extend** | Medium vs high impact; high impact and evidence gaps always reach the founder | Low-impact autonomous decisions by a single owner; per-action policy table |
| §4 "Agent consensus ≠ independent verification" | **Exists** | Stated in every red-team challenge and the export README | Model diversity per role (needs model routing) |
| §5 Meetings as a product feature | **Extend** | Kickoff, discovery workshop, prioritisation, design/architecture review, sprint planning/review, go/no-go, launch review, retrospective — agenda, attendees, transcript, decisions, actions | Human meetings via calendar integrations; action items as tracked tasks |
| §3/03 Customer discovery without fabrication | **Exists** | Synthetic personas are labelled rehearsal-only; hypotheses gain evidence only from founder-supplied notes; manifest counts real vs synthetic | Recruitment/consent workflows; transcript import |
| §6 Command Centre: overview, roadmap, team, research, meetings, decisions, build & QA, files | **Extend** | Briefing, KPIs, roadmap timeline, work plan, decisions, meetings, deliverables, interviews, workforce, activity, download | Click-through traceability milestone → task → agent → decision → evidence (data supports it; UI links are partial) |
| §7 Downloadable project package with manifest and completeness | **Exists** | `export.ts` + dependency-free ZIP: business/research/product/design/engineering/operations/quality/audit, `project-manifest.json`, `tasks.csv`, `dependencies.json`, `decisions.json` | PDF/XLSX formats; selective category export; Git repository export once code exists |
| §8 Task contract and provenance | **Extend** | Every item: owner, team, dependencies, credits, contract sections, reviewer; artefacts record generation mode and model | Per-task tool permissions and retry policy fields |
| §8 Four memory types | **Extend** | Canonical = decisions + approved gates (append-only records); evidence = interviews, reviews, verification; working = item state | Retrieval per agent (today: dependency-closure context); experience memory across projects |
| §9 Continuous technology research | **Extend** | Technology foresight division (DX-091–100) produces a radar with adopt/experiment/monitor/defer/reject | Live source connectors, verification, benchmarks |
| §10 Core services | **Extend** | Project service + workflow engine (`engine.ts`, optimistic versioning), registry, task/artefact, decision, meeting, export, evaluation (contracts, reviews, reputation) | Research service with citations; execution service; durable background orchestration (today one step per request) |
| §11 Autonomy modes | **Extend** | Effectively mode 2 (collaborative): routine work automatic, founder gates at four points | Configurable modes 1–4 per project and per action |
| §12 Release 1 success test | **Partial** | A full programme runs end to end and exports a valid package (test-enforced) | Fails the "real working software" bar until execution services exist |
| §13 Risks | **Extend** | Fabrication: labelling + manifest; false consensus: independent rounds + red team; endless debate: one bounded critique round; misleading progress: status derived from persisted items; budget: hard stop | Coding-agent isolation; change-impact replanning |

## 2. Recommended next build (in order)

1. **Execution service (Release 3 core, pulled forward).** Sprint items generate real code in an isolated sandbox with a Git branch per sprint. Verification runs the real test suite, and the export includes `engineering/source/`. Without this, the Release 1 success test can't pass.
2. **Research service with citations.** A web/literature connector with a source register (`research/sources.json`). Evidence scores in decisions are then derived from cited sources instead of option profiles.
3. **Model-generated decision options.** In model mode, generate options and criterion scores from the dossier. Keep the tally deterministic.
4. **Autonomy modes and decision tiers** as a per-project policy table enforced by the engine.
5. **Traceability links in the UI** (milestone → item → agent → decision → evidence) and selective export.
6. **Durable background execution:** queue-backed steps so programmes advance without an open browser tab.

## 3. Honest status

The coordination layer is real and tested: dependencies, gates, deliberation, vetoes, dissent, reputation, persistence and export. Content is real only in model mode, and even then the "engineering" is a prototype. The dashboard and export say so explicitly.
