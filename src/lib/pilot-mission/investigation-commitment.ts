/**
 * R1 — Pre-research commitment: scope, sources, limits, allowance (visible before spend).
 */
import {
  investigationAllowanceDemoLine,
  type InvestigationAllowanceLoad,
} from "../pilot/paid-availability";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "./research-mode";

export type InvestigationCommitment = {
  version: "commitment-v1";
  interpretation: string;
  scope: string[];
  sources: string[];
  limits: string[];
  allowanceLine: string;
  attachmentsNote: string;
};

export function interpretOneLiner(question: string): string {
  const q = question.trim().replace(/\s+/g, " ");
  if (q.length < 8) return "Add a short product question so we can interpret scope.";
  const looksLikeShould = /^should\b/i.test(q);
  const looksLikeHow = /^how\b/i.test(q);
  if (looksLikeShould) {
    return "Interpreted as a go / revise / pause / stop decision brief — not an automatic build.";
  }
  if (looksLikeHow) {
    return "Interpreted as a method question; investigation will separate feasibility from demand evidence.";
  }
  return "Interpreted as a product investigation brief. Research starts only after you approve the specialist plan.";
}

export function buildInvestigationCommitment(input: {
  question: string;
  researchMode: ResearchMode;
  researchProviderConfigured: boolean;
  researchProviderLabel: string;
  allowanceLoad: InvestigationAllowanceLoad;
  workspaceUsage?: { ceiling: number; consumed: number } | null;
  canStart: boolean;
  blockedReason: string | null;
}): InvestigationCommitment {
  const mode = RESEARCH_MODE_LABELS[input.researchMode];
  const sources = [
    "Your one-liner and optional details (founder-supplied).",
    input.researchProviderConfigured
      ? `Web search when selected: ${input.researchProviderLabel}.`
      : "Web search is not configured — gaps stay labelled; results are never invented.",
    "No customer interviews unless you later authorise interview work.",
  ];
  const limits = [
    `Research mode for this case: ${mode}.`,
    "Agents draft; you approve the plan before research runs.",
    "External acts never run without an explicit human gate.",
    "Books/publishing and regulated healthcare stay out of scope.",
  ];
  if (input.blockedReason) limits.push(input.blockedReason);

  const allowanceLine = (() => {
    const load = input.allowanceLoad;
    if (load.status === "failed") return load.reason;
    if (load.status === "demo") {
      if (input.workspaceUsage) return investigationAllowanceDemoLine(input.workspaceUsage);
      return "No paid pilot plan on this workspace yet. Demo mode uses the workspace usage ceiling until Builder, Founder, or Studio is activated.";
    }
    const remaining = load.snapshot.remaining;
    if (input.canStart) {
      return `${remaining} Investigation unit${
        remaining === 1 ? "" : "s"
      } remaining on this workspace plan. Starting a case commits one Investigation when the plan is approved and work begins under paid rules.`;
    }
    return `Cannot start: ${input.blockedReason ?? "Investigation allowance exhausted or unavailable."}`;
  })();

  return {
    version: "commitment-v1",
    interpretation: interpretOneLiner(input.question),
    scope: [
      "Investigate the stated idea for a founder decision pack.",
      "Compare options from the evidence register — not from invented interviews.",
      "Continuation (build/test artefacts) only after you choose a path and commercial rules allow.",
    ],
    sources,
    limits,
    allowanceLine,
    attachmentsNote:
      "File uploads and OCR are not supported. Optionally paste text excerpts below at intake, or add supplied evidence on the case after it starts.",
  };
}
