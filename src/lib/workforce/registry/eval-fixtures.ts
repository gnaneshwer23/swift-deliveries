/**
 * FIXTURES FOR ROLE EVALUATION SUITES. Everything in this file is invented
 * test material, labelled as such: no customer, interview, source or figure
 * here is real. The fixture mission is a booking tool for independent tutors.
 */
import type { StageKey } from "./roles";

export const FIXTURE_LABEL = "Fixture — invented test material, not real data";

/** Title under which the fixture upstream is given to a role; citable as a source. */
export const FIXTURE_UPSTREAM_TITLE = "Fixture upstream (invented test material)";

export const FIXTURE_MISSION = {
  title: "Fixture: tutor booking tool",
  requestText:
    "Fixture request: help independent tutors take bookings and payments without back-and-forth messages.",
  clarificationAnswers: {
    users: "Fixture: independent tutors with 5–30 regular students",
    constraints: "Fixture: web only, no payments provider chosen yet",
  } as Record<string, string>,
};

export type StageFixture = {
  stage: StageKey;
  /** Text the role is given as upstream input (labelled fixture). */
  upstream: string;
  /** Output that meets every rule for the stage. */
  good: string;
  /** Outputs that each break one rule, with the failure the check must report. */
  bad: Array<{ name: string; output: string; expect: RegExp }>;
};

const charterGood = `## Problem
Independent tutors lose time arranging lessons by message, and missed replies cost bookings.

## Target users
- Independent tutors with 5–30 regular students.

## Desired outcome
Tutors confirm a booking without a message exchange.

## Constraints
- Web only; no payments provider chosen yet.

## Success criteria
- A student can book an open slot in under two minutes.
- A tutor sees every booking in one list.

## Open questions
- Which payment provider do tutors already use?`;

const marketGood = `## Market landscape
- [Inference] Most tutors already use a calendar tool and messaging apps together.

## Customer segments
- [Assumption] Independent tutors with regular students are the first segment; agencies are out of scope.

## Competitors
- [Assumption] General scheduling tools exist but are not built around recurring lessons.

## Demand hypotheses
- [Assumption] Tutors would switch if booking took less time than messaging.

## Evidence gaps
- No interviews have been run; demand needs checking with real tutors.`;

const researchGood = `## Research questions
- How do tutors arrange lessons today?

## Findings
- [Inference] Rescheduling is the most frequent message type, based on the founder's request.
- [Sourced fact] The request says bookings are arranged by message (Source: mission request).

## Evidence quality
Low: the only source is the founder's request.

## Unresolved questions
- How often do students cancel late?`;

const prdGood = `## Problem statement
Tutors lose bookings to slow message exchanges.

## Target users
Independent tutors and their students.

## Value proposition
Booking without back-and-forth.

## Requirements
- R1: A student can see a tutor's open slots.
- R2: A student can book a slot.
- R3: A booking request is approved by the tutor before it is confirmed.

## Acceptance criteria
- R1: Open slots for the next 14 days are shown.
- R2: A booked slot disappears from the open list.
- R3: An unapproved request is shown to the student as pending.

## Success metrics
- Share of bookings made without a message.

## Risks
- Tutors may not keep availability up to date.

## Out of scope
- Payments in the first release.`;

const uxUpstream = "Fixture PRD requirements:\n- R1: open slots\n- R2: book a slot";
const uxGood = `## User journeys
- Student finds an open slot and books it.

## Information architecture
- Availability, Bookings.

## Screens
- Open slots (R1)
- Booking confirmation (R2)

## Accessibility
- Every slot is a button with a readable date and time.`;

const releaseGood = `## Release candidate
A release candidate awaiting the founder's decision: slot list and booking.

## Evidence summary
- Prototype static checks recorded in the test report.

## Unresolved risks
- Availability may go stale.

## Rollout plan
- Invite three fixture tutors once the founder decides.

## Rollback plan
- Turn off booking and fall back to messages.`;

const evolutionGood = `## Product metrics
- Share of bookings made without a message.

## Instrumentation
- Count bookings by channel.

## Feedback loops
- Ask tutors after their tenth booking.

## Next experiments
- Hypothesis: reminders cut late cancellations. Measure: late cancellations per week.`;

export const STAGE_FIXTURES: readonly StageFixture[] = [
  {
    stage: "charter",
    upstream: "",
    good: charterGood,
    bad: [
      {
        name: "proposes a solution as the problem",
        output: charterGood.replace(
          "Independent tutors lose time",
          "We will build a booking app because independent tutors lose time",
        ),
        expect: /proposes a solution/,
      },
      {
        name: "claims the founder approved it",
        output: `${charterGood}\n\nThis charter has been approved.`,
        expect: /claims an approval/,
      },
      {
        name: "says the plan is approved",
        output: `${charterGood}\n\nOur plan is approved and the product was approved too.`,
        expect: /claims an approval/,
      },
      {
        name: "invents interviews",
        output: charterGood.replace(
          "## Desired outcome",
          "We interviewed 12 tutors who all wanted this.\n\n## Desired outcome",
        ),
        expect: /interviews or survey results/,
      },
    ],
  },
  {
    stage: "market",
    upstream: charterGood,
    good: marketGood,
    bad: [
      {
        name: "states an unsourced market size",
        output: marketGood.replace(
          "## Customer segments",
          "- The tutoring market is worth $5 billion.\n\n## Customer segments",
        ),
        expect: /figure\(s\) neither sourced nor labelled/,
      },
      {
        name: "leaves a demand hypothesis unlabelled",
        output: marketGood.replace("- [Assumption] Tutors would", "- Tutors would"),
        expect: /without an evidence label/,
      },
    ],
  },
  {
    stage: "research",
    upstream: charterGood,
    good: researchGood,
    bad: [
      {
        name: "sourced fact without a source",
        output: researchGood.replace(" (Source: mission request)", ""),
        expect: /without a \(Source/,
      },
      {
        name: "unlabelled finding",
        output: researchGood.replace("- [Inference] Rescheduling", "- Rescheduling"),
        expect: /without an evidence label/,
      },
      {
        name: "cites a source the role was not given",
        output: researchGood.replace("(Source: mission request)", "(Source: Gartner 2026 report)"),
        expect: /cite a source that was not given/,
      },
      {
        name: "claims the product shipped",
        output: researchGood.replace(
          "## Evidence quality",
          "- [Inference] We shipped the product to five tutors.\n\n## Evidence quality",
        ),
        expect: /claims a deployment/,
      },
      {
        name: "invents a survey",
        output: researchGood.replace(
          "## Evidence quality",
          "- [Sourced fact] 80% of respondents prefer apps (Source: our survey of 200 tutors).\n\n## Evidence quality",
        ),
        expect: /interviews or survey results/,
      },
    ],
  },
  {
    stage: "prd",
    upstream: researchGood,
    good: prdGood,
    bad: [
      {
        name: "requirement without an ID",
        output: prdGood.replace("- R2: A student can book a slot.", "- A student can book a slot."),
        expect: /must start with its ID/,
      },
      {
        name: "second requirement unlabelled while the first mentions its ID",
        output: prdGood.replace(
          "- R1: A student can see a tutor's open slots.\n- R2: A student can book a slot.",
          "- R1: A student can see a tutor's open slots (see R2).\n- A student can book a slot.",
        ),
        expect: /numbered R1, R2/,
      },
      {
        name: "requirement without acceptance criteria",
        output: prdGood.replace("- R2: A booked slot disappears from the open list.\n", ""),
        expect: /none for R2/,
      },
      {
        name: "missing out-of-scope section",
        output: prdGood.replace(/## Out of scope[\s\S]*$/, ""),
        expect: /missing sections: Out of scope/,
      },
    ],
  },
  {
    stage: "ux",
    upstream: uxUpstream,
    good: uxGood,
    bad: [
      {
        name: "screen not traced to a requirement",
        output: uxGood.replace("- Booking confirmation (R2)", "- Booking confirmation\n- Settings"),
        expect: /not traced to a requirement/,
      },
      {
        name: "a requirement no screen serves",
        output: uxGood.replace("- Booking confirmation (R2)", "- Booking confirmation (R1)"),
        expect: /no screen serves R2/,
      },
    ],
  },
  {
    stage: "release",
    upstream: prdGood,
    good: releaseGood,
    bad: [
      {
        name: "says the product launched",
        output: releaseGood.replace(
          "## Unresolved risks",
          "The product launched to fixture tutors.\n\n## Unresolved risks",
        ),
        expect: /claims a deployment/,
      },
      {
        name: "claims a deployment",
        output: releaseGood.replace(
          "A release candidate awaiting the founder's decision",
          "The product has been deployed",
        ),
        expect: /claims a deployment/,
      },
    ],
  },
  {
    stage: "evolution",
    upstream: releaseGood,
    good: evolutionGood,
    bad: [
      {
        name: "experiment without a measure",
        output: evolutionGood.replace(" Measure: late cancellations per week.", ""),
        expect: /without a "Measure:"/,
      },
    ],
  },
];

/** Prototype fixtures for the deterministic test role (DX-071). */
export const PROTOTYPE_FIXTURES = {
  good: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fixture booking</title></head><body><main><h1>Open slots</h1><button type="button">Mon 10:00</button></main></body></html>`,
  broken: `<html><body><div>Fixture booking</div></body></html>`,
};
