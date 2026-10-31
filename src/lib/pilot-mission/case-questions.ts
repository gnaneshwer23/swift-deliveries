/**
 * Questions about one supervised case, answered from its saved record.
 *
 * Deterministic: no model call, nothing invented, nothing saved. Every answer names the part
 * of the record it came from. Chat never changes the case — requests to approve, decide or
 * change scope are pointed at the screen's own actions.
 */
import { buildMissionDashboard } from "./mission-dashboard-screen";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { buildProductIntelligenceMap } from "./product-intelligence-map";
import type { SupervisedMission } from "./types";
import { HUMAN_NEXT_PATH_LABELS, normalizeDecisionChoice } from "./verdict";

export type CaseTopic =
  | "change_request"
  | "next_step"
  | "approvals"
  | "recommendation"
  | "risks"
  | "research_next"
  | "evidence"
  | "workstreams"
  | "team"
  | "options"
  | "decision"
  | "usage"
  | "summary"
  | "unknown";

export type CaseAnswer = {
  topic: CaseTopic;
  text: string;
  /** Which part of the saved record the answer is read from. */
  basis: string;
};

/** Checked in order: the first match wins. */
const TOPICS: Array<[CaseTopic, RegExp]> = [
  [
    "change_request",
    // Only clear instructions to act. "Update me on…" or "Start with the risks" are questions.
    /^(?:please\s+)?(?:approve|authori[sz]e|cancel|pause|resume|delete)\b|\b(?:can|could|will|would) you (?:please )?(?:approve|authori[sz]e|decide|cancel|pause|resume|delete|export|build)\b|\b(?:change|narrow|widen|expand) (?:the )?scope\b/i,
  ],
  ["approvals", /\b(?:approv\w*|waiting on me|need(?:s)? me|my (?:decision|sign[- ]?off))\b/i],
  ["next_step", /\b(?:block\w*|next step|what(?:'s| is) next|stuck|holding|status|stage)\b/i],
  ["recommendation", /\b(?:recommend\w*|why (?:this|that)|your (?:view|advice))\b/i],
  ["risks", /\b(?:risk\w*|concern\w*|danger|threat\w*)\b/i],
  ["workstreams", /\bworkstreams?\b/i],
  ["research_next", /\b(?:research next|more research|gaps?|unknowns?|missing|don'?t know)\b/i],
  ["evidence", /\b(?:evidence|sources?|cit\w+|support\w*|proof|data)\b/i],
  ["team", /\b(?:team|agents?|specialists?|who is working|roles?)\b/i],
  ["options", /\b(?:options?|alternatives?|choices?)\b/i],
  ["decision", /\b(?:decid\w*|decision|chose|chosen|path)\b/i],
  ["usage", /\b(?:usage|budget|cost|units?|spend\w*|ceiling)\b/i],
  ["summary", /\b(?:summar\w*|overview|so far|on the record|recap)\b/i],
];

export function caseQuestionTopic(question: string): CaseTopic {
  // Phones and macOS type curly apostrophes ("what’s"); the patterns use straight ones.
  const text = question.trim().replace(/[\u2018\u2019]/g, "'");
  if (!text) return "unknown";
  return TOPICS.find(([, pattern]) => pattern.test(text))?.[0] ?? "unknown";
}

const list = (items: string[], max = 3) =>
  items
    .slice(0, max)
    .map((item) => `• ${item}`)
    .join("\n");

const more = (items: string[], max = 3) =>
  items.length > max ? `\n…and ${items.length - max} more on the case.` : "";

export function answerCaseQuestion(mission: SupervisedMission, question: string): CaseAnswer {
  const topic = caseQuestionTopic(question);
  // Built only for the topics that read them.
  const dash = () => buildMissionDashboard(mission);
  const pack = () => buildPmBriefingPack(mission);

  switch (topic) {
    case "change_request":
      return {
        topic,
        text: "I can't change the case from chat. Approvals, decisions and scope changes are saved only with the actions on this screen, so you always see exactly what you approve.",
        basis: "Chat is read-only for this case",
      };

    case "next_step": {
      const { risks, currentStage } = dash();
      const blockers = risks.filter((r) => r.kind === "blocker").map((r) => r.text);
      return {
        topic,
        text:
          `Next step: ${currentStage.title}. ${currentStage.detail}` +
          (blockers.length
            ? `\n\nRecorded blockers:\n${list(blockers)}${more(blockers)}`
            : "\n\nNo blockers are recorded on the case."),
        basis: "Next required action and blockers on the case record",
      };
    }

    case "approvals": {
      const { waitingOnYou, currentStage } = dash();
      return {
        topic,
        text: waitingOnYou.length
          ? `Waiting on you:\n${list(waitingOnYou)}${more(waitingOnYou)}`
          : `Nothing is waiting on you right now. The next step is: ${currentStage.title}.`,
        basis: "Approval gates and your steps on the case record",
      };
    }

    case "recommendation": {
      const { recommendationLabel, recommendationRationale } = pack();
      return {
        topic,
        text: recommendationLabel
          ? `My draft recommendation: ${recommendationLabel}. ${recommendationRationale}\n\nIt is a draft until you record a decision.`
          : "There is no recommendation yet. It is drafted once options or a research pass are on the case.",
        basis: "Agent recommendation derived from the case's evidence",
      };
    }

    case "risks": {
      const risks = dash().risks.map((r) => `${r.kind === "gap" ? "Gap" : "Risk"}: ${r.text}`);
      const items = risks.length ? risks : pack().unknowns;
      return {
        topic,
        text: items.length
          ? `Recorded on the case:\n${list(items)}${more(items)}`
          : "No risks, blockers or unknowns are recorded on the case yet.",
        basis: "Risks, blockers and evidence gaps on the case record",
      };
    }

    case "research_next": {
      const gaps = [
        ...mission.researchGaps,
        ...mission.evidence.filter((e) => e.classification === "gap").map((e) => e.statement),
      ];
      return {
        topic,
        text: gaps.length
          ? `These are the open gaps on the case, so they are where more research would help most:\n${list(gaps)}${more(gaps)}\n\nTo ask for it, use "Request more research" so it is saved as a decision.`
          : "No research gaps are recorded on the case.",
        basis: "Research gaps and evidence gaps on the case record",
      };
    }

    case "evidence": {
      const sourced = mission.evidence.filter((e) => e.classification === "supplied");
      const lines = sourced.map((e) => (e.source ? `${e.statement} — ${e.source}` : e.statement));
      const assumptions = mission.evidence.filter((e) => e.classification === "assumption").length;
      const gaps = mission.evidence.filter((e) => e.classification === "gap").length;
      return {
        topic,
        text:
          (lines.length
            ? `Evidence on the case (${lines.length} supplied or sourced):\n${list(lines)}${more(lines)}`
            : "No supplied or sourced evidence is on the case yet.") +
          `\n\nAlso recorded: ${assumptions} assumption${assumptions === 1 ? "" : "s"} and ${gaps} gap${gaps === 1 ? "" : "s"}.`,
        basis: "Evidence register on the case record",
      };
    }

    case "workstreams": {
      const map = buildProductIntelligenceMap(mission);
      const open = map.workstreams.filter((w) => w.state !== "complete");
      return {
        topic,
        text: open.length
          ? `Workstreams not yet complete:\n${list(
              open.map((w) => `${w.label}: ${w.stateLabel} — ${w.detail}`),
              6,
            )}`
          : "Every workstream is complete on the case record.",
        basis: "Workstream states on the case's intelligence map",
      };
    }

    case "team": {
      const { activeAgents, completedOutputs } = dash();
      const agents = activeAgents.map((a) => `${a.label} · ${a.status}`);
      const outputs = completedOutputs.map((o) => `${o.title} (${o.honestyLabel})`);
      return {
        topic,
        text:
          (agents.length
            ? `Specialists on this case:\n${list(agents, 5)}${more(agents, 5)}\n\nStatuses change only when their work is saved to the case.`
            : "No specialists are assigned on the case yet. The team is selected after you approve a direction.") +
          (outputs.length
            ? `\n\nCompleted outputs:\n${list(outputs)}${more(outputs)}`
            : "\n\nNo completed outputs are saved on the case yet."),
        basis: "Team plan and completed outputs on the case record",
      };
    }

    case "options": {
      const options = (mission.proposal?.options ?? []).map((o) => `${o.title} — ${o.tradeoff}`);
      const generation = mission.proposal?.generation;
      const producedBy = generation?.ran
        ? `\n\nDrafted by model ${generation.model ?? generation.provider ?? "(id not recorded)"}.`
        : "\n\nThese are simulated drafts: no model ran.";
      return {
        topic,
        text: options.length
          ? `Options drafted on the case:\n${list(options)}${more(options)}${producedBy}`
          : "No options are drafted on the case yet.",
        basis: "Option drafts on the case record",
      };
    }

    case "decision":
      return {
        topic,
        text: mission.approval
          ? `Your recorded decision: ${
              HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]
            }${mission.approval.note ? ` — "${mission.approval.note}"` : ""} (saved ${mission.approval.decidedAt}).`
          : "No decision is recorded on the case yet.",
        basis: "Decision record on the case",
      };

    case "usage": {
      const { usage } = dash();
      return {
        topic,
        text: `${usage.label}. Used ${usage.consumed} of ${usage.ceiling} units on this case.`,
        basis: "Usage record on the case",
      };
    }

    case "summary": {
      const { currentStage, latestPmUpdate } = dash();
      return {
        topic,
        text: [
          `Stage: ${currentStage.title}.`,
          `Evidence: ${mission.evidence.length} item${mission.evidence.length === 1 ? "" : "s"}; options drafted: ${mission.proposal?.options.length ?? 0}.`,
          mission.approval
            ? `Decision: ${HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]}.`
            : "No decision recorded yet.",
          `Latest update: ${latestPmUpdate.summary}`,
        ].join("\n"),
        basis: "Case record summary",
      };
    }

    case "unknown":
      return {
        topic,
        text: "I answer from this case's saved record. Ask about the next step, approvals, my recommendation, risks, research gaps, evidence, workstreams, the team, options, your decision or usage.",
        basis: "No matching part of the case record",
      };
  }
}
