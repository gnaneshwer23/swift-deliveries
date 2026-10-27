# Role registry and evaluations

Code: `src/lib/workforce/registry/`.

## Three statuses, kept apart

- **Availability.** May the planner assign the role? A role is assignable only if it has a definition in `roles.ts`. A test enforces this. Today 8 roles are available and 142 are planned.
- **Execution mode.** How the role is built to run: a model workflow (it writes stage artefacts under its instructions) or deterministic (DX-071 runs the static prototype checks).
- **Evaluation.** Has the role's evaluation suite passed against a real model? Roles show **Not evaluated** until a run is recorded in `evaluations.json`.

## What a role definition holds

Each definition in `roles.ts` records:

- its purpose and what it must not do;
- its inputs and the stages it leads;
- the context it may read;
- its tools (none yet);
- its limits;
- when it escalates to the founder;
- its execution mode.

Model-workflow roles also have versioned instructions (`instructions.ts`, for example `DX-023@1`). Change the version whenever the text changes.

## Output checks

`output-checks.ts` holds deterministic rules per stage, on top of the handoff contract:

- Claims in checked sections (market demand hypotheses, research findings) must carry an evidence label, and a sourced fact must cite one of the inputs the role was given: the mission request, the clarification answers or an upstream artefact.
- Figures in the market sections must be sourced from a given input or labelled.
- Requirements start with IDs numbered R1, R2, … in order, and each has acceptance criteria that start with its ID. Every screen traces to a requirement, and every requirement appears on a screen.
- The output must not describe interviews or surveys the founder didn't supply.
- No stage may claim that the work was approved or that the product was deployed, released, launched or shipped.

When a role leads a stage, the worker adds the role's instructions to the prompt and applies these checks. Output that fails twice fails the step.

## Evaluation suites

Each role's suite (`evaluation.ts`) has two parts:

1. **Fixture checks**, run in CI by `npm test`. Labelled fixtures (`eval-fixtures.ts`) prove the checks accept good output for every stage the role leads, and reject each kind of bad output. This proves the suite works, not the role.
2. **Model evaluation**, run with `npm run eval:roles`, using the same checks and corrective retry as a production step. The role writes each stage for the fixture mission under its instructions, and the checks grade the output.
   - With no model configured, every role is reported as **not run**.
   - Set `RECORD_ROLE_EVALS=1` to write the results to `evaluations.json`. The role then shows "Evaluation passed" or "Evaluation failed".
   - This spends model credits. Run it only with the owner's approval.

## Model calls

Every stage-generation call is recorded on the task's run in `wf_task_runs`:

- provider, model and request ID;
- input and output tokens, summed across the corrective retry;
- latency and number of calls;
- lead role and instruction version;
- the failure class.

With model mode off, stages use simulated drafts that are labelled as such. With model mode on, a call that produces no accepted output never turns into a simulated draft:

- A transient failure (timeout, network, rate limit, provider error, incomplete output) puts the step back in the queue, up to 3 attempts.
- A lasting failure (not configured, refused, rejected request, empty output, checks failed twice) fails the task, with the reason.

## Department mapping

`department-mapping.ts` is versioned. Version 2 keeps the code's department 10 (Foresight) and 13 (Product Analytics) scopes, without renumbering any ID. It also records what DX-091–100 and DX-121–130 meant in version 1 (healthcare and publishing, both out of scope). `content/capabilities/registry.json` is generated from the code with `npm run registry:export`, and a test fails if the two drift.
