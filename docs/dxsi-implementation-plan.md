# DeliverX Super Intelligence (DXSI) — gap analysis and implementation plan

**Date:** 22 Oct 2026 · **Vision source:** founder brief "DeliverX Super Intelligence — Product Vision" (150 roles, 15 divisions, 8-stage lifecycle, 5 intelligence layers).
**Builds on:** `docs/prd-deliverx-supervised-ai-workforce.md`, `docs/workforce-architecture-and-agent-catalogue.md`, `docs/prd-gap-analysis.md`.

## 1. Research basis

The vision's own recommendation — prove one reproducible end-to-end mission before expanding the workforce — matches the external evidence:

- **Most multi-agent failures are about coordination, not the model.** The MAST taxonomy (NeurIPS 2025, 1,600+ annotated traces across 7 frameworks) groups 14 failure modes into system-design issues, inter-agent misalignment and task verification. ([arXiv 2503.13657](https://arxiv.org/html/2503.13657v3))
- **Errors cascade through sequential handoffs** unless each stage is validated against the next stage's input contract. Silent partial results are a recurring production failure. ([Prefactor](https://prefactor.tech/blog/multi-agent-orchestration-failure-modes-evaluation), [Beam](https://beam.ai/agentic-insights/multi-agent-orchestration-patterns-production), [Conceptualise](https://www.conceptualise.de/en/blog/multi-agent-failure-modes))
- **Parallel, breadth-first work is where multi-agent pays off.** Tightly coupled work like coding benefits less, and token spend dominates cost and quality. ([Anthropic engineering](https://www.anthropic.com/engineering/multi-agent-research-system))

Design consequences used here:

- an explicit dependency graph;
- a typed handoff contract per stage;
- loud failure that stops only the dependent branch;
- parallel discovery;
- bounded retries;
- deterministic (non-agent) budget and permission enforcement.

## 2. Vision vs current build

| Vision element                          | Before this change                                                                       | Now                                                                                                              | Still open                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 150 roles / 15 divisions                | 150-role registry, 12 Available; department taxonomy differs from the vision's divisions | Unchanged; product missions assign Available roles only                                                          | Reconcile divisions ↔ departments (§5)                             |
| Role ≠ model ≠ task                     | Registry roles; no model layer                                                           | Model-agnostic runner (Vercel AI Gateway / OpenRouter), chosen by env, separate from roles and tasks             | Per-role model routing on measured quality and cost                |
| 8-stage lifecycle                       | 3 intents with 4–5 linear tasks                                                          | **"Build a product" intent**: 14-task DAG across all 8 stages                                                    | Production code generation (Stage 5)                               |
| Mission orchestrator / dependency graph | Linear `sort_order`                                                                      | DAG scheduler: validation, runnable set, cascade-blocking, parallel waves                                        | Real concurrent workers (today one step per call)                  |
| Artifact & evidence system              | Artefacts with quality and evidence labels                                               | Each stage consumes its upstream artefacts; handoff contracts; generation provenance on every artefact           | Versioned artefacts; evidence graph                                |
| Human control & QA                      | Plan approval and an external-action gate                                                | **Human gates** at scope, design and release; approval marks inputs Human-reviewed                               | Multi-member reviewer roles                                        |
| Verification                            | Simulated "structure check" note                                                         | **Real deterministic verify stage**: re-checks every contract, 8 static prototype checks, PRD traceability table | Behavioural and E2E tests on generated code                        |
| Honest status / simulated disclosure    | Text disclaimers                                                                         | Per-artefact "Model: X" or "Simulated draft" badge, with the fallback reason recorded                            | —                                                                  |
| Budget enforcement                      | Read-modify-write (race could overspend or double-run a step)                            | Atomic task claim; optimistic-locked usage charge                                                                | DB-side ledger function                                            |
| Product Brain / Intelligence Graph      | —                                                                                        | — (Phase 2)                                                                                                      | Canonical decisions, assumptions and requirements store            |
| Future-tech intelligence                | —                                                                                        | Foresight stage outputs a radar with adopt / experiment / monitor / defer / reject                               | Source connectors, maturity tracking, sandbox benchmarks (Phase 3) |
| Learning loop                           | Audit events + usage                                                                     | Audit now records generation mode and model per task                                                             | Outcome dataset for routing (Phase 4)                              |
| Privacy                                 | —                                                                                        | Model calls blocked when likely identifiers are present (NHS number with checksum, NI, SSN, DOB, MRN)            | DPIA; tenant-level "never send to cloud" switch                    |

## 3. What shipped (Phase 1 proof point)

**Lifecycle (`src/lib/workforce/lifecycle.ts`):**

1. Charter.
2. Market evidence ∥ deep research ∥ technology foresight (parallel).
3. PRD → **scope gate**.
4. UX spec ∥ architecture & delivery plan → **design gate**.
5. Sandboxed prototype.
6. Automated verification.
7. Release pack → **release gate** → optional external publish (Act externally).
8. Evolution plan.

Total cost is 82 credits, which fits the default 100-credit ceiling.

**Infrastructure (deterministic, not agents):**

- `graph.ts`: DAG validation, scheduling, unreachable detection, wave grouping.
- `contracts.ts`: markdown section contracts and static HTML checks.
- `privacy.ts`: identifier screen.
- `runMissionStep`:
  - atomic claim, so a double click or a second tab cannot run the same step twice;
  - optimistic usage charge;
  - non-gate tasks run first;
  - gates block the mission until an operator decides;
  - failures stop only dependants, and the mission ends `partially_completed` with the failure named in the delivery report.

**Model mode (`model-runner.server.ts`):**

- OpenAI-compatible chat completions.
- Upstream artefacts are passed as data, never instructions.
- One corrective retry when the contract is not met.
- 90 s timeout.
- On any failure it falls back to the simulated draft with the reason disclosed.
- Off unless `DXSI_MODEL_ENABLED=true`.

**Tests (`product-mission.test.ts`, 20 cases):** scheduler rules, plan shape, the parallel discovery wave, gate ordering, contract failure isolation, ceiling hard-stop, metadata round-trip, provider opt-in and the identifier screen. These include a full in-memory end-to-end mission run.

## 4. Deploying

1. **Apply the migration** `supabase/migrations/20261022100000_dxsi_product_mission.sql`. It is additive: it widens two CHECK constraints and adds a service-role-only `wf_schema_version()`. Until it is applied, the app hides "Build a product" (the composer shows it disabled) and every existing flow is unchanged.
2. **Optional — enable direct OpenAI model mode** (Vercel project environment variables / deployment secrets):
   - `DXSI_MODEL_ENABLED=true`
   - `OPENAI_API_KEY=<set as a deployment secret; never commit it or send it in chat>`
   - `DXSI_MODEL=<a model ID available to your OpenAI project>` (or `DXSI_OPENAI_MODEL` for direct OpenAI), and `DXSI_MODEL_ALLOWLIST` listing it. There is no built-in default model (changed in Phase 0); without a model and the allowlist, no model is called and outputs stay labelled simulated drafts.
   - OpenAI is selected ahead of gateway providers when `OPENAI_API_KEY` is present. If it is absent, the existing Vercel AI Gateway / OpenRouter provider selection remains available.
   - The provider key alone does not activate model calls: `DXSI_MODEL_ENABLED=true` remains an explicit opt-in. A failed or blocked model call falls back to a disclosed simulated draft.
   - Keep keys server-side only; do not use a `VITE_`-prefixed variable or expose them to browser code.
3. **Function duration:** a model stage can take 30–90 s. Fluid compute's default limit covers this, but if a project-level `maxDuration` is set lower, raise it.

## 5. Decisions (resolved 22 Oct 2026: Healthcare and Books departments replaced by Future Technology & Foresight and Product Analytics; regulated healthcare out of scope — see docs/dxsi-capability-audit.md)

1. **Divisions vs departments.** The vision's 15 divisions (e.g. Future Technology & Foresight; Delivery, Operations & Coordination; Product Analytics) don't match the registry's 15 departments (e.g. Books, Education & Publishing; Sales & Commercial Ops). Pick one canonical taxonomy before Phase 4. Re-keying is a registry data change only, because DX IDs are stable.
2. **Clinical missions.** Healthcare & Life Sciences roles are Planned, and the UK context implies MHRA SaMD and DTAC exposure for any clinician-facing output. Keep clinical product missions as "design and prototype only" until a domain reviewer role and a DPIA exist.
3. **Stage 5 scope.** Moving from sandboxed prototype to real code needs isolated execution (branch or sandbox per mission, reviewed diffs). That is the Phase 2 headline item.

## 6. Next phases (sequenced)

- **Phase 2:**
  - Product Brain table (append-only decisions, assumptions and requirements with supersedes links);
  - artefact versioning;
  - sandboxed code execution for Stage 5;
  - a reviewer role (separate from the operator).
- **Phase 3:**
  - research connectors (literature, patents, release notes) with source provenance;
  - persistent technology radar;
  - benchmark harness for model/tech comparisons.
- **Phase 4:**
  - activate roles by measured quality;
  - routing from the outcome dataset (accepted / rejected / revised per artefact);
  - reusable team templates.
- **Phase 5:** analytics and feedback connectors driving evidence-backed roadmap updates.

## 7. Agreed end-to-end target and current boundary

The first delivery target is idea → research → PRD → prototype/code → automated tests → preview. The existing `build` mission already runs a lifecycle DAG for charter, market/customer hypotheses, research dossier, technology foresight, PRD, UX/architecture, a self-contained HTML prototype, deterministic static verification, release pack and evolution plan. Its “research” is model-generated unless grounded in supplied evidence; a direct OpenAI key does not itself provide live web research or independently verified citations. The current verifier checks contracts and static HTML properties; it does not execute generated application code in an isolated sandbox or run browser end-to-end tests. Public preview deployment is not yet implemented and remains an external action requiring explicit approval. Do not present the existing HTML artefact as production code, the static checks as full runtime tests, or a release plan as a deployed preview.

Next implementation slice after this provider adapter: add source-backed web research with preserved URLs/citation metadata; then isolated, resource-limited code execution and test reports; then approval-gated preview deployment. Keep those capabilities disabled/unavailable until each is implemented and validated.

Provider hardening: optionally set DXSI_PROVIDER=openai and DXSI_OPENAI_MODEL to a direct model ID. Gateway-prefixed IDs are rejected for direct OpenAI. Incomplete, refused and invalid outputs retain a disclosed simulation label; this is not production agent execution certification.
