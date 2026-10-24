import { type ProductBrief } from "./product-resources";

export const BRIEF_PRESETS = {
  founder: {
    label: "Validate an idea",
    audience: "Founders and independent builders",
    question: "Which customer problem should we investigate first?",
    input: "A target audience, product idea and practical constraints",
    work: "Compare the problem, alternatives and evidence gaps",
    output: "An opportunity decision and a discovery plan",
    brief: {
      product: "My product idea",
      audience: "Describe the people you want to help and their context.",
      problem: "Which customer problem should we investigate first?",
      objective: "Choose a bounded discovery question before committing to a build.",
      constraints:
        "Do not contact customers, spend externally or build a live product without approval.",
      evidence: "Not yet supplied. Identify assumptions and what would change the decision.",
    },
  },
  team: {
    label: "Improve a product",
    audience: "Product managers and product teams",
    question: "Which onboarding change should we investigate first?",
    input: "Your current workflow, authorised notes and desired outcome",
    work: "Trace observations to options and an owner decision",
    output: "A decision record and a scoped experiment brief",
    brief: {
      product: "Onboarding improvement",
      audience: "New users setting up our product; specify the segment before starting.",
      problem: "Which onboarding change should we investigate first?",
      objective: "Identify an evidence-grounded next experiment and how we would measure it.",
      constraints:
        "Do not modify the live product, contact users or deploy. Ask for owner approval.",
      evidence:
        "Supply authorised setup notes and baseline data. No customer evidence is included in this example.",
    },
  },
  student: {
    label: "Learn by building",
    audience: "Students and first-time product builders",
    question: "How could we help a student organise a small study project?",
    input: "A learning goal, a specific user and a small product question",
    work: "Explain alternatives, inspect assumptions and justify scope",
    output: "A product brief, decision record and learning reflection",
    brief: {
      product: "Study project organiser",
      audience:
        "Students coordinating a small study project; validate this audience with genuine research.",
      problem: "How could we help a student organise a small study project?",
      objective: "Learn to frame a product problem and explain a bounded next step.",
      constraints:
        "Learning exercise. No real personal data, external contact or deployment. Prototype only if separately agreed.",
      evidence:
        "Hypothetical starting point, not established research. Record genuine observations and reflect on what changes your mind.",
    },
  },
} satisfies Record<
  string,
  {
    label: string;
    audience: string;
    question: string;
    input: string;
    work: string;
    output: string;
    brief: ProductBrief;
  }
>;
export type BriefPreset = keyof typeof BRIEF_PRESETS;
export function parseBriefPreset(value: unknown): BriefPreset | undefined {
  return value === "founder" || value === "team" || value === "student" ? value : undefined;
}
