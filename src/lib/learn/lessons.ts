/**
 * Learn by building: short lessons that follow the real steps of a DeliverX project.
 * Each lesson says what the step is, why it matters, how DeliverX does it, the common
 * mistake, and what to try in your own project. Nothing here claims an outcome.
 */
import type { FirstProjectStepId } from "@/lib/pilot-mission/first-project";

export type Lesson = {
  id: string;
  n: number;
  title: string;
  /** One line for lists and cards. */
  summary: string;
  /** The project step where you practise this. */
  step: FirstProjectStepId;
  what: string;
  why: string;
  how: string[];
  mistake: string;
  tryIt: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "frame-the-question",
    n: 1,
    title: "Frame a product question",
    summary: "Turn an idea into a question a team can actually investigate.",
    step: "idea",
    what: "A product question names who has a problem, what the problem is and what a better outcome would look like. “An app for restaurants” is an idea; “Can small restaurants cut nightly food waste with a 2-minute closing log?” is a question.",
    why: "Every later step inherits the question. A vague question gets vague research, broad options and a decision nobody can check.",
    how: [
      "You write one or two lines. Aria asks a few clarifying questions before anything is planned.",
      "Missing pieces, such as who the first users are, are listed as unknowns rather than guessed.",
      "Nothing runs until you approve the plan built from your question.",
    ],
    mistake: "Describing a solution (“build a booking app”) instead of a problem worth solving.",
    tryIt: "Start a project with one sentence that names a person, a problem and an outcome.",
  },
  {
    id: "evidence-vs-assumptions",
    n: 2,
    title: "Evidence vs assumptions",
    summary: "Know which things you have seen and which you are guessing.",
    step: "plan",
    what: "Evidence is something observed and traceable: a cited source, an interview you held, a number you measured. An assumption is a belief you have not checked yet.",
    why: "Decisions built on unlabelled assumptions feel certain and fail quietly. Keeping the two apart tells you what to test first.",
    how: [
      "Research items keep their source references; gaps are kept as gaps, not filled in.",
      "Only notes from meetings you actually held count as evidence; DeliverX never invents customers or quotes.",
      "Conflicting evidence is flagged and kept, not averaged away.",
    ],
    mistake: "Treating a confident paragraph, from a person or an AI, as evidence.",
    tryIt: "Open your project’s record and find one claim you would want a second source for.",
  },
  {
    id: "approve-a-plan",
    n: 3,
    title: "Approving a plan: scope, team, usage",
    summary: "Agree what will be done, by whom and at what cost before anyone starts.",
    step: "plan",
    what: "A plan states the question, the roles that will work on it, the time it should take and the usage it may spend.",
    why: "Approval is where you control cost and scope. Changing a plan after work starts wastes effort and can invalidate earlier approvals.",
    how: [
      "The plan lists the specialists and what each will produce.",
      "Usage has a ceiling; billable steps stop when it is reached.",
      "If the plan changes, you approve it again. An old approval never carries over to a new plan.",
    ],
    mistake: "Approving without reading what will not be done.",
    tryIt:
      "Before approving your next plan, read the unknowns and decide whether any should be answered first.",
  },
  {
    id: "compare-options",
    n: 4,
    title: "Comparing options and trade-offs",
    summary: "See two or three real directions side by side before choosing.",
    step: "decision",
    what: "An option is a direction with what it gains, what it costs and what could go wrong. Good options differ in kind, not just in size.",
    why: "With one option there is no decision, only approval. Comparing makes trade-offs visible and dissent recordable.",
    how: [
      "The team drafts directions with trade-offs and evidence gaps for each.",
      "A recommendation is labelled as a recommendation, not a decision.",
      "Agents agreeing with each other is not proof; the choice still comes to you.",
    ],
    mistake: "Picking the option with the best story rather than the best evidence.",
    tryIt:
      "For your project’s options, write one sentence on what would make you change your mind.",
  },
  {
    id: "make-the-decision",
    n: 5,
    title: "Making the decision, and owning it",
    summary: "Choose, say why, and say what you expect to happen.",
    step: "decision",
    what: "A decision records the chosen option, the reason and an expectation you can check later.",
    why: "Writing the expectation down before you see the result is what lets you learn from the outcome, instead of explaining it away.",
    how: [
      "Only you record the decision; agents can recommend but never decide.",
      "You note what you expect to happen and how you will know.",
      "The decision, your reason and the evidence used are kept in the project record.",
    ],
    mistake: "Deciding without stating what result would prove you wrong.",
    tryIt:
      "When you decide in your project, write the one number or signal you will check afterwards.",
  },
  {
    id: "reviews-and-gates",
    n: 6,
    title: "Reviews and gates while it’s built",
    summary: "Check the work at the points where mistakes are cheap to fix.",
    step: "delivery",
    what: "Delivery builds your chosen direction in stages (charter, requirements, design, prototype, checks). A gate is a human review between stages.",
    why: "Errors travel downstream: a wrong requirement becomes a wrong design and a wrong prototype. Reviewing early is cheaper than fixing late.",
    how: [
      "Each stage’s output must pass its handoff check before the next stage uses it.",
      "Agents can stop at a gate but can never pass one; only you can approve or send work back.",
      "The Workroom shows who owns each task, what it must include and how it is checked.",
    ],
    mistake: "Approving a gate by skimming the summary instead of the output.",
    tryIt: "At your next review, open one output and check it against its “Done when” line.",
  },
  {
    id: "read-your-package",
    n: 7,
    title: "Reading your package: what’s real, what’s simulated",
    summary: "Know how every file was made before you share it.",
    step: "package",
    what: "The package is everything the project produced: briefing, decisions, outputs, prototype and a manifest of how each was made.",
    why: "A simulated draft can look finished. If you share it as real work, you mislead the people relying on it.",
    how: [
      "Every output says how it was produced: by a named model or as a simulated draft.",
      "Quality labels say exactly what was checked; there is no generic “verified”.",
      "The manifest lists what is simulated and what was not bundled.",
    ],
    mistake: "Sharing a prototype as if it had been tested with users.",
    tryIt: "Download your package and find the manifest line that says what was simulated.",
  },
  {
    id: "record-what-happened",
    n: 8,
    title: "Recording what actually happened",
    summary: "Close the loop with an observed outcome, not a hoped-for one.",
    step: "outcome",
    what: "An outcome is what you observed after acting: the number you measured, what users did, what changed.",
    why: "Without a recorded outcome, every project looks like a success. The record is how you and your team get better.",
    how: [
      "You compare what happened with the expectation you wrote when deciding.",
      "Only observed outcomes are recorded; DeliverX never fills one in for you.",
      "The next project can start from what this one learned.",
    ],
    mistake: "Recording what you hoped would happen, or nothing at all.",
    tryIt:
      "After your project ships, record one observed result, even if it is “not enough data yet”.",
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Lessons practised in a project: their step is done in the record. Nothing is inferred. */
export function practisedLessons(doneSteps: Set<FirstProjectStepId>): Set<string> {
  return new Set(LESSONS.filter((l) => doneSteps.has(l.step)).map((l) => l.id));
}
