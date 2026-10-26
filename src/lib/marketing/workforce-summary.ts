/**
 * A compact view of the capability registry for marketing pages, so they do
 * not ship the full registry. `workforce-summary.test.ts` checks it against
 * `src/lib/workforce/registry` and fails if the two drift.
 */
export type WorkforceIntent = "investigate" | "prototype" | "improve" | "build";

export const WORKFORCE_DEPARTMENTS = [
  { n: 1, name: "Executive Intelligence", short: "Executive", size: 10 },
  { n: 2, name: "Research and Intelligence", short: "Research", size: 10 },
  { n: 3, name: "Product Management", short: "Product", size: 10 },
  { n: 4, name: "Design and UX", short: "Design & UX", size: 10 },
  { n: 5, name: "Software Engineering", short: "Engineering", size: 10 },
  { n: 6, name: "AI and Data Engineering", short: "AI & Data", size: 10 },
  { n: 7, name: "Security, Privacy and Governance", short: "Security", size: 10 },
  { n: 8, name: "QA and Reliability", short: "QA", size: 10 },
  { n: 9, name: "Infrastructure and Delivery", short: "Infrastructure", size: 10 },
  { n: 10, name: "Future Technology and Foresight", short: "Foresight", size: 10 },
  { n: 11, name: "Growth and Marketing", short: "Growth", size: 10 },
  { n: 12, name: "Sales and Commercial Operations", short: "Commercial", size: 10 },
  { n: 13, name: "Product Analytics and Continuous Improvement", short: "Analytics", size: 10 },
  { n: 14, name: "Finance, Legal and Governance", short: "Finance & Legal", size: 10 },
  { n: 15, name: "Agent Operations and Orchestration", short: "Agent Ops", size: 10 },
] as const;

export const WORKFORCE_AVAILABLE_IDS = [
  "DX-001",
  "DX-002",
  "DX-011",
  "DX-012",
  "DX-018",
  "DX-020",
  "DX-021",
  "DX-023",
  "DX-035",
  "DX-041",
  "DX-049",
  "DX-071",
] as const;

export const WORKFORCE_TOTAL = WORKFORCE_DEPARTMENTS.reduce((sum, d) => sum + d.size, 0);

export const WORKFORCE_INTENTS: Record<
  WorkforceIntent,
  ReadonlyArray<{ id: string; name: string; department: number }>
> = {
  investigate: [
    { id: "DX-001", name: "Chief of Staff Agent", department: 1 },
    { id: "DX-002", name: "Problem-Framing Agent", department: 1 },
    { id: "DX-011", name: "Research Planning Agent", department: 2 },
    { id: "DX-012", name: "Web Research Agent", department: 2 },
    { id: "DX-018", name: "Evidence Verification Agent", department: 2 },
    { id: "DX-020", name: "Research Synthesis Agent", department: 2 },
  ],
  prototype: [
    { id: "DX-001", name: "Chief of Staff Agent", department: 1 },
    { id: "DX-002", name: "Problem-Framing Agent", department: 1 },
    { id: "DX-021", name: "Product Discovery Agent", department: 3 },
    { id: "DX-023", name: "PRD Agent", department: 3 },
    { id: "DX-035", name: "Wireframing Agent", department: 4 },
    { id: "DX-041", name: "Software Architect Agent", department: 5 },
    { id: "DX-071", name: "Test Strategy Agent", department: 8 },
  ],
  improve: [
    { id: "DX-001", name: "Chief of Staff Agent", department: 1 },
    { id: "DX-002", name: "Problem-Framing Agent", department: 1 },
    { id: "DX-021", name: "Product Discovery Agent", department: 3 },
    { id: "DX-035", name: "Wireframing Agent", department: 4 },
    { id: "DX-041", name: "Software Architect Agent", department: 5 },
    { id: "DX-049", name: "Code Review Agent", department: 5 },
    { id: "DX-071", name: "Test Strategy Agent", department: 8 },
  ],
  build: [
    { id: "DX-001", name: "Chief of Staff Agent", department: 1 },
    { id: "DX-002", name: "Problem-Framing Agent", department: 1 },
    { id: "DX-011", name: "Research Planning Agent", department: 2 },
    { id: "DX-012", name: "Web Research Agent", department: 2 },
    { id: "DX-018", name: "Evidence Verification Agent", department: 2 },
    { id: "DX-020", name: "Research Synthesis Agent", department: 2 },
    { id: "DX-021", name: "Product Discovery Agent", department: 3 },
    { id: "DX-023", name: "PRD Agent", department: 3 },
    { id: "DX-035", name: "Wireframing Agent", department: 4 },
    { id: "DX-041", name: "Software Architect Agent", department: 5 },
    { id: "DX-049", name: "Code Review Agent", department: 5 },
    { id: "DX-071", name: "Test Strategy Agent", department: 8 },
  ],
};
