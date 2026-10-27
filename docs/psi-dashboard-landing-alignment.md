# Dashboard, landing pages and PSI vision alignment

24 October 2026. Reviewed against the current live homepage, the landing-page source, the forward PSI roadmap and the founder-supplied agent-network reference.

## Product contract

DeliverX helps founders, product teams and students turn a product question into supplied evidence, compared options, an owner decision, reviewable work and a later outcome review. Students learn through the same work. The 150-role catalogue is not a claim of 150 running agents. Observed outcomes require supplied evidence; agreement, an export or a completed task does not establish product impact.

## Traceability

| Landing-page concept | Dashboard destination                                  | Current behaviour                                                                                                                   |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Evidence & memory    | Product Brain → selected saved mission → evidence      | Sources, supplied observations, assumptions and gaps remain attached to the mission.                                                |
| Judgement            | Selected mission → compared options and owner decision | The existing proposal, version/scope and owner decision remain inspectable.                                                         |
| Delivery             | Selected mission → decision and experiment brief       | Existing reviewable artefact and export behaviour retained; this does not authorise deployment.                                     |
| Feedback loop        | Selected mission → outcome review                      | Expected and owner-supplied observed results stay separate. Review/follow-up approval remains explicit.                             |
| Specialists          | Shared navigation → reference-based agent network      | Canonical 150 DX role IDs and 15 departments; availability, declared tools, limitations and recorded task activity remain distinct. |
| Learn by building    | Same onboarding and mission environment                | Shared evidence/decision standards; no career/CV route or separate lower-standard learner product added.                            |

## Corrections implemented

1. Public Product Brain illustration and dashboard now import the same four layer labels from `src/lib/psi-journey.ts`, preventing terminology drift.
2. Product overview now selects a saved mission record. Each layer opens its own real record section rather than sending every click back to the new-brief form.
3. Stable mission section anchors group evidence, judgement, delivery and feedback. Deep links wait for asynchronous mission data before scrolling. A missing comparison/pack/review explains the next required action without fabricating completion.
4. Navigation uses “Specialists” consistently. The agent network retains the founder HTML's three-pane layout and original reference file; it is not converted back into the previous dark diagram.
5. Programme recommendation percentages are explicitly weighted support; individual preferences are labelled preference strength. These labels do not imply independent evidence or statistical certainty.

## Verification

Signed-in browser checks exercised all four destinations on the isolated synthetic acceptance mission. Evidence and feedback anchors were verified near the intended 24px scroll offset after async load. The original full test suite passes 192 tests with 16 environment-dependent skips. TypeScript, lint and production build are checked for this candidate; lint has nine existing warnings.

The live homepage was inspected in the browser to avoid relying on a stale search-engine snapshot. Its current heading is “From product idea to continuous intelligence,” and it explicitly bounds the available supervised loop and future capabilities.

## Remaining platform work

This is experience alignment, not a declaration that the whole PSI roadmap is implemented. Cross-mission evidence versioning/impact analysis, evaluated specialist reasoning, durable runtime recovery, supervised assignment proposals, a full task-dependency execution graph, connected analytics and production deployment capability remain gated roadmap work. The production schema migration and bounded-provider/operational acceptance requirements recorded in `docs/psi-phase-one-reliability.md` remain separate.

No provider was enabled, no real customer outcome was invented and no production database migration was performed for this alignment pass.
