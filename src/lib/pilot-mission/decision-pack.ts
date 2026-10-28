/**
 * Honest decision-pack export: Markdown + a plain-text PDF.
 * Labels distinguish human, model, and simulated contributions.
 * Linked sources are referenced; they are not bundled.
 */
import { buildCommerceDisclosureMarkdown } from "./commerce";
import { buildDecisionRoadmapMarkdown } from "./decision-roadmap";
import { buildLearnerLensMarkdown } from "./learner-lens";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { buildTeamCollaborationMarkdown } from "./team-collaboration";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "./research-mode";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  deriveAgentRecommendation,
  normalizeDecisionChoice,
  researchTeamLines,
} from "./verdict";

export type DecisionPackHonesty = {
  generationLabel: string;
  productionMode: "human" | "model" | "simulated" | "mixed";
  sourcesBundled: false;
  note: string;
};

export function honestyFor(mission: SupervisedMission): DecisionPackHonesty {
  const label = mission.proposal?.generation.label ?? "No comparison recorded";
  const ran = mission.proposal?.generation.ran === true;
  const productionMode: DecisionPackHonesty["productionMode"] = !mission.proposal
    ? "human"
    : ran
      ? "mixed"
      : "simulated";
  return {
    generationLabel: label,
    productionMode,
    sourcesBundled: false,
    note: ran
      ? `Comparison generation: ${label} (model). Decision and observations are human. Linked sources are not bundled in this file.`
      : `Comparison generation: ${label}. Options may be a deterministic draft from supplied evidence. Decision and observations are human. Linked sources are not bundled in this file.`,
  };
}

export function buildDecisionPackMarkdown(mission: SupervisedMission): string {
  const honesty = honestyFor(mission);
  const researchMode = (mission.researchMode ?? "provided") as ResearchMode;
  const team = mission.team;
  const approval = mission.approval;
  const proposal = mission.proposal;
  const option = proposal?.options.find((o) => o.id === approval?.optionId);
  const evidenceLines =
    mission.evidence
      .map(
        (e) =>
          `- [${e.classification}] ${e.statement}${e.source ? ` — ref: ${e.source}` : " — no source ref"} (access: reference only; not bundled)`,
      )
      .join("\n") || "- None recorded.";

  const assumptions = mission.evidence.filter((e) => e.classification === "assumption");
  const gaps = mission.evidence.filter((e) => e.classification === "gap");
  const generationGaps = proposal?.generation.gaps ?? [];
  const researchGaps = mission.researchGaps ?? [];

  const specialistLines =
    team?.tasks
      .map(
        (t) =>
          `- ${t.title} · owner: ${t.ownerLabel}${t.capabilityId ? ` (${t.capabilityId})` : ""} · status: ${t.status}${t.blockedReason ? ` · ${t.blockedReason}` : ""}`,
      )
      .join("\n") ?? "- Specialist team not recorded on this mission.";

  const approvalHistory = [
    ...(mission.invalidatedApprovals ?? []).map(
      (a) =>
        `- Invalidated: ${a.choice} option ${a.optionId} at ${a.decidedAt} by ${a.actorId}. Reason: ${a.reason}`,
    ),
    approval
      ? `- Current: ${approval.choice} option ${approval.optionId} at ${approval.decidedAt} by ${approval.actorId}${approval.note ? `. Note: ${approval.note}` : ""}`
      : "- No human decision recorded yet.",
  ].join("\n");

  const activityLines =
    (mission.activity ?? [])
      .slice(-40)
      .map((e) => `- ${e.at} · ${e.actor} · ${e.kind}: ${e.summary}`)
      .join("\n") || "- No persisted task events yet.";

  const followUp = mission.followUp;
  const followUpLines = followUp
    ? [
        `Status: ${followUp.status}`,
        `Proposed at: ${followUp.proposedAt}`,
        followUp.status === "approved"
          ? `Approved at: ${followUp.approvedAt} by ${followUp.approvedBy}. New mission id: ${followUp.missionId}. Later steps are not auto-approved.`
          : "Not started. Approval is required before a follow-up mission exists.",
        `Proposed brief: ${followUp.brief.question}`,
      ].join("\n")
    : "No follow-up proposed yet. A review can propose one; nothing starts automatically.";

  return [
    `# Decision pack`,
    ``,
    `## Honesty labels`,
    `- Production mode: ${honesty.productionMode}`,
    `- Generation: ${honesty.generationLabel}`,
    `- Sources bundled: no`,
    `- ${honesty.note}`,
    ``,
    `## 1. Mission objective, scope and constraints`,
    `Question: ${mission.brief.question}`,
    `Audience: ${mission.brief.audience}`,
    `Intended outcome: ${mission.brief.outcome}`,
    `Constraints: ${mission.brief.constraints || "None recorded."}`,
    `Research mode: ${RESEARCH_MODE_LABELS[researchMode]}`,
    ``,
    `## 2. Evidence register`,
    evidenceLines,
    ``,
    `### Assumptions`,
    assumptions.length
      ? assumptions.map((e) => `- ${e.statement}${e.source ? ` (${e.source})` : ""}`).join("\n")
      : "- None labelled as assumptions.",
    ``,
    `### Uncertainties, contradictions and external gaps`,
    gaps.length
      ? gaps.map((e) => `- Gap: ${e.statement}`).join("\n")
      : "- No evidence gaps labelled.",
    generationGaps.length
      ? generationGaps.map((g) => `- Generation gap: ${g}`).join("\n")
      : "- No generation gaps recorded.",
    researchGaps.length
      ? researchGaps.map((g) => `- Research: ${g}`).join("\n")
      : "- No research-mode external gaps recorded.",
    ``,
    `## 3. Diligence recommendation (Act A)`,
    (() => {
      const stored = approval?.agentRecommendation;
      const draft = stored
        ? {
            recommendation: stored,
            rationale: approval?.recommendationRationale ?? "",
            executionLimited: approval?.executionLimited === true,
          }
        : deriveAgentRecommendation(mission);
      const path = approval ? normalizeDecisionChoice(approval.choice) : null;
      return [
        `Agent recommendation: ${AGENT_RECOMMENDATION_LABELS[draft.recommendation]}`,
        `Rationale: ${draft.rationale || "Not recorded."}`,
        draft.executionLimited
          ? "Execution note: recommendation reflects provider/retrieval limits — not an evidence-based market pause."
          : "Execution note: diligence ran within the declared scope (or simulation).",
        path
          ? `Human next path: ${HUMAN_NEXT_PATH_LABELS[path]}${
              approval?.disagreesWithRecommendation
                ? " — differs from recommendation; recommendation remains on the record."
                : ""
            }`
          : "Human next path: not recorded yet.",
      ].join("\n");
    })(),
    ``,
    `### Research team (investigate)`,
    researchTeamLines(mission)
      .map((l) => `- ${l}`)
      .join("\n") || "- No research-team ownership recorded.",
    ``,
    `## 4. Options compared`,
    proposal
      ? proposal.options
          .map(
            (o) =>
              `- ${o.id}: ${o.title}. Trade-off: ${o.tradeoff}. Basis: ${o.basis}.${option?.id === o.id ? " ← selected for the authorised path" : ""}`,
          )
          .join("\n")
      : "- Options have not been compared yet.",
    ``,
    `## 5. Human decisions and approval history`,
    approvalHistory,
    ``,
    `## 6. Product / experiment brief`,
    mission.artefact?.experimentBrief ??
      "Not prepared yet. Record the decision and measurement plan first.",
    ``,
    `## 7. Execution and review status`,
    `Mission stage: ${mission.stage}`,
    `Job: ${mission.job.status}${mission.job.lastError ? ` (${mission.job.lastError})` : ""}`,
    `Usage: ${mission.usageConsumed} / ${mission.usageCeiling}`,
    `Expectation: ${mission.expectation ? `hypothesis “${mission.expectation.hypothesis}”; metric “${mission.expectation.expectedMetric}”` : "not recorded"}`,
    `Observation: ${mission.observation ? `${mission.observation.label} Result: ${mission.observation.result}` : "none (DeliverX does not measure results)"}`,
    `Reviews: ${mission.reviews.length}`,
    ``,
    `### Specialist ownership`,
    specialistLines,
    ``,
    `### Persisted activity (task events only)`,
    activityLines,
    ``,
    `## 8. Proposed next step and outcome-review plan`,
    followUpLines,
    mission.expectation
      ? `Outcome-review plan: compare owner-supplied observation to expected metric “${mission.expectation.expectedMetric}” within “${mission.expectation.observationWindow}”. Uncertainty stays in words.`
      : "Outcome-review plan: record expectation before treating a later result as a review of this decision.",
    ``,
    (() => {
      const briefing = buildPmBriefingPack(mission);
      if (!briefing.ready) return `## Product briefing\nNot ready — compare options first.`;
      return [
        `## Product briefing`,
        `Understood idea: ${briefing.understoodIdea}`,
        briefing.recommendationLabel
          ? `Recommendation: ${briefing.recommendationLabel}`
          : "Recommendation: pending",
        `Rationale: ${briefing.recommendationRationale}`,
        ``,
        `### Supporting evidence`,
        ...(briefing.supporting.length
          ? briefing.supporting.map((l) => `- ${l}`)
          : ["- None on the register yet."]),
        ``,
        `### Counterevidence & gaps`,
        ...(briefing.counterevidence.length
          ? briefing.counterevidence.map((l) => `- ${l}`)
          : ["- None labelled yet."]),
        ``,
        `### Important unknowns`,
        ...(briefing.unknowns.length
          ? briefing.unknowns.map((l) => `- ${l}`)
          : ["- None labelled yet."]),
        ``,
        briefing.disagreesWithRecommendation && briefing.humanNextPathLabel
          ? [
              `### Human decision vs agent recommendation`,
              `- Agent recommendation remains on the record: ${briefing.recommendationLabel ?? "Pending"}`,
              `- Human next path: ${briefing.humanNextPathLabel}`,
              `- Choosing a different path does not erase the recommendation.`,
              briefing.humanDecisionNote ? `- Human note: ${briefing.humanDecisionNote}` : "",
            ].join("\n")
          : briefing.humanNextPathLabel
            ? `### Human next path\n- ${briefing.humanNextPathLabel}`
            : "",
        ``,
        `### Separate assessments`,
        ...briefing.assessments.map(
          (a) =>
            `- ${a.title} — ${a.reading.replaceAll("_", " ")}. ${a.summary}${
              a.basisIds.length ? ` (basis: ${a.basisIds.join(", ")})` : ""
            }`,
        ),
        ``,
        `### Actionable SWOT`,
        ...briefing.swot.map(
          (s) =>
            `- **${s.kind}:** ${s.statement}\n  - Basis: ${s.basis}\n  - Implication: ${s.implication}\n  - Next question: ${s.nextQuestion}`,
        ),
        ``,
        `Smallest defensible next step: ${briefing.smallestNextStep}`,
        briefing.honesty,
      ].join("\n");
    })(),
    ``,
    buildTeamCollaborationMarkdown(mission) ??
      `## Recorded team collaboration\nNot recorded on this mission.`,
    ``,
    buildLearnerLensMarkdown(mission),
    ``,
    buildCommerceDisclosureMarkdown(mission),
    ``,
    buildDecisionRoadmapMarkdown(mission),
    ``,
    `## Provenance`,
    mission.artefact?.provenance ?? honesty.note,
    ``,
    `## Export note`,
    `This Markdown is the stored mission export. Reloading it does not create another usage record.`,
    `Linked sources named above are references only; they are not packaged with this file.`,
  ].join("\n");
}

function pdfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrapLines(markdown: string, maxWidth = 90): string[] {
  const wrapped: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (line.length <= maxWidth) {
      wrapped.push(line);
      continue;
    }
    let rest = line;
    while (rest.length > maxWidth) {
      let cut = rest.lastIndexOf(" ", maxWidth);
      if (cut < 40) cut = maxWidth;
      wrapped.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    if (rest) wrapped.push(rest);
  }
  return wrapped.length ? wrapped : [""];
}

/** Minimal multi-page text PDF. Content matches the Markdown honesty contract. */
export function buildDecisionPackPdf(markdown: string): Uint8Array {
  const wrapped = wrapLines(markdown);
  const linesPerPage = 52;
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  const pushObj = (id: number, content: string) => {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${content}\nendobj\n`;
  };

  pushObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  const fontId = 3;
  pushObj(fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  let nextId = 4;

  for (const pageLines of pages) {
    const stream = [
      "BT",
      "/F1 10 Tf",
      "50 782 Td",
      "14 TL",
      ...pageLines.flatMap((line, index) => {
        const escaped = pdfEscape(line.length ? line : " ");
        return index === 0 ? [`(${escaped}) Tj`] : [`T* (${escaped}) Tj`];
      }),
      "ET",
    ].join("\n");
    const contentId = nextId++;
    contentObjectIds.push(contentId);
    const length = new TextEncoder().encode(stream).length;
    pushObj(contentId, `<< /Length ${length} >>\nstream\n${stream}\nendstream`);
    pageObjectIds.push(nextId++);
  }

  for (let i = 0; i < pageObjectIds.length; i++) {
    pushObj(
      pageObjectIds[i]!,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectIds[i]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
  }

  pushObj(
    2,
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`,
  );

  const xrefOffset = body.length;
  body += `xref\n0 ${nextId}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i < nextId; i++) {
    body += `${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

export function decisionPackFilenames(missionId: string): { md: string; pdf: string } {
  const short = missionId.slice(0, 8);
  return {
    md: `decision-pack-${short}.md`,
    pdf: `decision-pack-${short}.pdf`,
  };
}

export function pdfToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}
