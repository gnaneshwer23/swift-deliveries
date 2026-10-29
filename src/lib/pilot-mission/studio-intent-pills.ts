/** Omni intake intent pills — seed the supervised brief line only; start still requires a click. */
export const STUDIO_INTENT_PILLS = [
  {
    id: "investigate",
    label: "Investigate an idea",
    question: "Should we pursue this product idea before we commit build budget?",
  },
  {
    id: "compare",
    label: "Compare options",
    question: "What are the credible paths forward, and what evidence would falsify each?",
  },
  {
    id: "test",
    label: "Plan a bounded test",
    question: "What is the smallest test that would change our decision in the next few weeks?",
  },
  {
    id: "revise",
    label: "Revise the proposition",
    question: "What would we need to change in the proposition for this to be worth pursuing?",
  },
] as const;
