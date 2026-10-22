/**
 * Meetings: agenda, attendees, transcript, decisions and action items.
 *
 * When a meeting carries a decision, the transcript is the deliberation
 * itself — every position, veto, change of mind and dissent is spoken by the
 * agent that holds it, so the record shows how each judgement depended on
 * the others.
 */
import { deliberate } from "./deliberation";
import { displayName, member } from "./roster";
import { hashSeed, pick, rng } from "./rng";
import type {
  ActionItem,
  DecisionRecord,
  MeetingRecord,
  ProgrammeState,
  TranscriptTurn,
  WorkItem,
} from "./types";

const AGENDAS: Record<NonNullable<WorkItem["meetingType"]>, string[]> = {
  kickoff: [
    "Business case walkthrough",
    "Decision rights and human gates",
    "Roadmap and division responsibilities",
    "Risks and first actions",
  ],
  discovery_workshop: [
    "Research findings",
    "Interview signals",
    "Technology foresight",
    "Decide the first segment",
  ],
  prioritisation: [
    "Requirements and business model recap",
    "Scope options and trade-offs",
    "Commit MVP scope",
  ],
  architecture_review: [
    "Architecture walkthrough",
    "Threat model findings",
    "Choose build approach",
  ],
  design_review: [
    "Journey walkthrough",
    "Accessibility and content review",
    "Choose experience direction",
  ],
  sprint_planning: ["Sprint goal", "Story selection and estimates", "Dependencies and risks"],
  sprint_review: ["Demo", "Quality and defects", "Cost and velocity", "Retrospective actions"],
  go_no_go: ["Verification results", "Security and operational readiness", "Launch decision"],
  launch_review: [
    "Go-to-market readiness",
    "Instrumentation readiness",
    "Support and success readiness",
  ],
  retrospective: ["What worked", "What did not", "Changes to how the workforce operates"],
};

/** What each department typically contributes in a status discussion. */
const DEPARTMENT_VOICE: Record<number, string[]> = {
  1: [
    "Keeping the programme anchored to the business objectives: {goals}.",
    "Flagging that decision rights stay with the operator at every gate.",
  ],
  2: [
    "Evidence so far is thin in places; I'll mark inferences separately from sourced facts.",
    "We should not treat synthetic interview signals as validation.",
  ],
  3: [
    "Scope must trace back to the problem: {problem}.",
    "Every requirement needs an observable acceptance criterion.",
  ],
  4: [
    "The first-run experience decides adoption; keep the primary journey short.",
    "Accessibility is a requirement, not a polish item.",
  ],
  5: [
    "We can deliver this incrementally; integration risk is the main unknown.",
    "I'd keep the first release on boring, well-understood technology.",
  ],
  6: [
    "Any AI feature needs an evaluation set before it ships.",
    "Data quality will limit model value more than model choice.",
  ],
  7: [
    "Least privilege and tenant isolation from day one.",
    "Personal data must be minimised and never sent to third parties without a lawful basis.",
  ],
  8: [
    "Release gates must be evidence-based: tests, not opinions.",
    "I'll trace each acceptance criterion to a check.",
  ],
  9: [
    "Operational cost must stay predictable as usage grows.",
    "We need observability before launch, not after.",
  ],
  10: [
    "Worth monitoring emerging options, but nothing enters scope without evidence of maturity.",
    "A technology watchlist will keep the roadmap future-proof.",
  ],
  11: [
    "Positioning has to speak to {users} in their own words.",
    "We should plan launch experiments, not a single big-bang.",
  ],
  12: [
    "The buying journey and objections need to be understood before pricing is final.",
    "Early design partners will shorten the sales cycle.",
  ],
  13: [
    "Define the north-star metric now so instrumentation is built in.",
    "Every roadmap change should cite a measured outcome.",
  ],
  14: [
    "Spend so far is within budget; I'll keep the cost forecast current.",
    "Commercial assumptions must be explicit and testable.",
  ],
  15: [
    "Dependencies are on track; I'll surface blockers early.",
    "Workforce cost per accepted deliverable is being tracked.",
  ],
};

function fill(text: string, state: ProgrammeState): string {
  const bc = state.businessCase;
  return text
    .replaceAll("{goals}", bc.goals.slice(0, 120) || "the stated objectives")
    .replaceAll("{problem}", bc.problem.slice(0, 120) || bc.idea.slice(0, 120))
    .replaceAll("{users}", bc.targetUsers.slice(0, 80) || "our users");
}

function deliberationTurns(rec: DecisionRecord): TranscriptTurn[] {
  const label = (id: string) => rec.options.find((o) => o.id === id)?.label ?? id;
  const turns: TranscriptTurn[] = [
    {
      speaker: rec.owner,
      kind: "proposal",
      text: `Decision: ${rec.question} Options: ${rec.options.map((o) => `${o.label} — ${o.summary}`).join(" | ")}. Positions are formed independently first.`,
    },
  ];
  for (const p of rec.round1) {
    turns.push({
      speaker: p.capabilityId,
      kind: "position",
      text: `I favour ${label(p.optionId)} (confidence ${Math.round(p.confidence * 100)}%). ${p.rationale} ${p.concern}`,
    });
  }
  for (const v of rec.vetoes) {
    turns.push({
      speaker: v.capabilityId,
      kind: "concern",
      text: `Veto on ${label(v.optionId)}: ${v.reason}.`,
    });
  }
  for (const p of rec.round2.filter((x) => x.revisedFrom)) {
    turns.push({
      speaker: p.capabilityId,
      kind: "position",
      text: `Revising from ${label(p.revisedFrom!)} to ${label(p.optionId)}. ${p.rationale}`,
    });
  }
  for (const d of rec.dissent.slice(0, 4)) {
    turns.push({
      speaker: d.capabilityId,
      kind: "concern",
      text: `For the record, I dissent: ${label(d.optionId)}.`,
    });
  }
  turns.push({
    speaker: rec.challenge.by,
    kind: "concern",
    text: `Red-team challenge: ${rec.challenge.note}`,
  });
  turns.push({
    speaker: rec.owner,
    kind: "update",
    text: rec.sensitivity.robust
      ? "Sensitivity check: the choice holds even if any single criterion is ignored."
      : `Sensitivity check: the choice depends on ${rec.sensitivity.flipsWithout.join(", ")} — those assumptions need evidence.`,
  });
  turns.push({
    speaker: rec.owner,
    kind: "decision",
    text:
      rec.outcome === "adopted"
        ? `Adopted: ${label(rec.chosenOptionId!)}. ${rec.rationale}${rec.needsHumanRatification ? " High impact — goes to the operator for ratification." : ""}`
        : `Escalated to the operator. ${rec.rationale}`,
  });
  return turns;
}

export function runMeeting(
  item: WorkItem,
  state: ProgrammeState,
): { meeting: MeetingRecord; decision: DecisionRecord | null } {
  const rand = rng(hashSeed(state.id, item.key));
  const attendees = Array.from(new Set([item.owner, ...item.team]));
  const agenda = AGENDAS[item.meetingType!];
  const transcript: TranscriptTurn[] = [
    {
      speaker: item.owner,
      kind: "facilitation",
      text: `Welcome. Purpose: ${item.description} Agenda: ${agenda.join("; ")}.`,
    },
  ];

  const done = state.roadmap.items.filter(
    (i) => i.status === "completed" && i.kind === "deliverable",
  );
  if (done.length) {
    transcript.push({
      speaker: item.owner,
      kind: "update",
      text: `Inputs available: ${done
        .slice(-4)
        .map((d) => d.title)
        .join(", ")}. Credits used ${state.budget.consumed}/${state.budget.ceiling}.`,
    });
  }

  // Status voices: one per department present, in its own lens.
  const seenDepts = new Set<number>();
  for (const id of attendees) {
    const dept = member(id).departmentNumber;
    if (seenDepts.has(dept) || id === item.owner) continue;
    seenDepts.add(dept);
    transcript.push({
      speaker: id,
      kind: "update",
      text: fill(pick(rand, DEPARTMENT_VOICE[dept] ?? ["No update."]), state),
    });
    if (seenDepts.size >= 6) break;
  }

  let decision: DecisionRecord | null = null;
  if (item.decision) {
    decision = deliberate(item.decision, state.id);
    transcript.push(...deliberationTurns(decision));
  }

  const actionOwners = attendees.filter((a) => a !== item.owner).slice(0, 3);
  const actionItems: ActionItem[] = actionOwners.map((owner, i) => ({
    owner,
    text: `${agenda[Math.min(i + 1, agenda.length - 1)]}: follow up and record the outcome in the programme log.`,
    dueWeek: item.week + 1,
  }));
  for (const a of actionItems) {
    transcript.push({ speaker: a.owner, kind: "action", text: `I'll take: ${a.text}` });
  }

  return {
    meeting: {
      type: item.meetingType!,
      facilitator: item.owner,
      attendees,
      agenda,
      transcript,
      decisionKeys: decision ? [decision.key] : [],
      actionItems,
      week: item.week,
    },
    decision,
  };
}

export function meetingMarkdown(
  title: string,
  m: MeetingRecord,
  decision: DecisionRecord | null,
): string {
  return `# ${title}

**Week ${m.week}** · Facilitator: ${displayName(m.facilitator)} · ${m.attendees.length} attendees

> Simulated meeting: agent statements are generated from each role's judgement lens and the programme record, not from a live discussion.

## Attendees
${m.attendees.map((a) => `- ${displayName(a)} — ${member(a).department}`).join("\n")}

## Agenda
${m.agenda.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Transcript
${m.transcript.map((t) => `**${displayName(t.speaker)}** _(${t.kind})_: ${t.text}`).join("\n\n")}

## Decisions
${decision ? `- ${decision.key}: ${decision.outcome === "adopted" ? `adopted ${decision.options.find((o) => o.id === decision.chosenOptionId)?.label}` : "escalated to the operator"} (support ${Math.round(decision.confidence * 100)}%)` : "None."}

## Action items
${m.actionItems.map((a) => `- [ ] ${displayName(a.owner)}: ${a.text} (due week ${a.dueWeek})`).join("\n") || "None."}
`;
}
