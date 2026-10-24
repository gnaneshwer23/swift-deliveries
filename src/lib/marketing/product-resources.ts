export type ProductBrief = {
  product: string;
  audience: string;
  problem: string;
  objective: string;
  constraints: string;
  evidence: string;
};
export const EMPTY_BRIEF: ProductBrief = {
  product: "",
  audience: "",
  problem: "",
  objective: "",
  constraints: "",
  evidence: "",
};
export const EXAMPLE_BRIEF: ProductBrief = {
  product: "Onboarding improvement",
  audience: "New users setting up a small software product",
  problem: "Which onboarding change should we investigate first?",
  objective: "Choose a bounded experiment and define what we would measure.",
  constraints: "Hypothetical example. Do not contact users, change the live product or deploy.",
  evidence:
    "No customer evidence supplied. Establish baseline data and genuine observations before treating assumptions as findings.",
};

export function briefMarkdown(brief: ProductBrief): string {
  const fields: [string, string][] = [
    ["Who it is for", brief.audience],
    ["Problem to investigate", brief.problem],
    ["Desired outcome", brief.objective],
    ["Constraints and non-goals", brief.constraints],
    ["Evidence available and gaps", brief.evidence],
  ];
  return `# Product brief\n\n${brief.product.trim() || "Untitled product"}\n\n${fields.map(([label, value]) => `## ${label}\n\n${value.trim() || "Not supplied — clarify before starting."}`).join("\n\n")}\n\n## Human review\n\nReview the scope, assumptions and evidence before commissioning work. This brief is user input, not validated research.\n`;
}

export const RESOURCE_TEMPLATES = [
  {
    key: "evidence",
    title: "Evidence register",
    image: "evidence-decision",
    description: "Separate what someone observed from what your team assumes.",
    body: "# Evidence register\n\n| Claim | Source or URL | Date | Observation, assertion or inference | Supports or challenges | Limitations |\n| --- | --- | --- | --- | --- | --- |\n| | | | | | |\n\n## Contradictions\n\nRecord conflicting findings; do not remove them to make a cleaner story.\n\n## Missing evidence\n\nWhat would change the decision?\n",
  },
  {
    key: "decision",
    title: "Decision record",
    image: "human-direction",
    description: "Keep the alternatives, trade-offs and human decision together.",
    body: "# Decision record\n\n## Question\n\n## Objective served\n\n## Options considered\n\n## Evidence and uncertainty\n\n## Trade-offs and dissent\n\n## Human decision and date\n\n## Expected outcome\n\n## When to revisit\n",
  },
  {
    key: "experiment",
    title: "Experiment brief",
    image: "learning-loop",
    description: "Write the expected result before you observe the outcome.",
    body: "# Experiment brief\n\n## Problem and hypothesis\n\n## Proposed change\n\n## Baseline and source\n\n## Expected outcome and measurement window\n\n## Guardrail metrics\n\n## Approval owner\n\n## Observed result and source\n\nLeave blank until an actual observation exists.\n\n## Limitations and next decision\n",
  },
] as const;

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
