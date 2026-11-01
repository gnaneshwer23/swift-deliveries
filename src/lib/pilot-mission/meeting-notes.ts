/**
 * Meeting notes → proposed tasks. The owner pastes notes from a meeting they held; a
 * rule-based reader (no model, so no notes text leaves the server) proposes actions,
 * decisions, open questions and ideas, each tied to the line it came from. Nothing joins
 * the project until the owner accepts it, and accepted items are not run by agents until
 * the owner adds them to a plan.
 *
 * Only owner-supplied notes are read: DeliverX never invents a meeting, attendee or quote.
 */
import { getCapability } from "@/lib/workforce/registry";

export const MEETING_NOTES_MAX_CHARS = 20_000;
export const MEETINGS_MAX = 30;
export const PROPOSALS_PER_MEETING_MAX = 25;

/** How the proposals were produced — shown beside them and in exports. */
export const MEETING_READER_LABEL = "Notes reader (rule-based, no AI model)";

export type MeetingProposalKind = "action" | "decision" | "question" | "idea";

export const MEETING_KIND_LABEL: Record<MeetingProposalKind, string> = {
  action: "Task",
  decision: "Decision",
  question: "Open question",
  idea: "Idea",
};

export type MeetingOwner = { kind: "you" } | { kind: "role"; capabilityId: string; name: string };

export type MeetingProposal = {
  id: string;
  kind: MeetingProposalKind;
  text: string;
  /** 1-based line in the saved notes this came from. */
  line: number;
  owner: MeetingOwner;
  status: "proposed" | "accepted" | "dismissed";
  decidedAt: string | null;
  decidedBy: string | null;
};

export type MeetingNote = {
  id: string;
  title: string;
  /** The date the owner says the meeting was held, if given (YYYY-MM-DD). */
  heldOn: string | null;
  /** Saved exactly as the owner supplied them. */
  notes: string;
  addedAt: string;
  addedBy: string;
  reader: typeof MEETING_READER_LABEL;
  proposals: MeetingProposal[];
};

const DECISION = /^(decision|decided|agreed)\b|\b(we decided|we agreed|agreed to|decision:)/i;
const QUESTION_PREFIX = /^(question|q|open question|open|tbd)\s*[:-]/i;
const UNSURE = /\b(not sure|unclear|tbd|to be decided|don'?t know|unknown)\b/i;
const ACTION_PREFIX = /^(action|todo|to do|ai|next step|follow[- ]?up)\s*[:-]/i;
const CHECKBOX = /^\[\s?\]\s*/;
const ACTION =
  /\b(will|i'll|we'll|need to|needs to|must|should|let'?s|going to|follow up|send|draft|book|schedule|set up|prepare|share|ship|build|fix|write|update|check|review|call|email)\b/i;
const IDEA = /^(idea)\s*[:-]|\b(what if|could we|maybe we|we could)\b/i;

/** Keyword → the Available catalogue role best placed to pick the item up. */
const ROLE_HINTS: Array<[RegExp, string]> = [
  [/\b(test|qa|bug|regression|acceptance)\b/i, "DX-071"],
  [/\b(wireframe|design|screen|ux|ui|layout|flow|mock-?up|prototype)\b/i, "DX-035"],
  [/\b(prd|spec|requirement|scope|feature|user stor(y|ies))\b/i, "DX-023"],
  [/\b(interview|survey|competitor|market|users?|customers?|research)\b/i, "DX-020"],
  [/\b(evidence|source|verify|data|numbers?|metric|citation)\b/i, "DX-018"],
  [/\b(prioriti[sz]e|roadmap|backlog|discovery|option)\b/i, "DX-021"],
  [/\b(problem|why|root cause|framing)\b/i, "DX-002"],
];

function ownerFor(kind: MeetingProposalKind, text: string): MeetingOwner {
  // Decisions are yours to record; first-person commitments are yours to do.
  if (kind === "decision" || /^(i|i'll|i will|me)\b/i.test(text)) return { kind: "you" };
  for (const [re, id] of ROLE_HINTS) {
    if (!re.test(text)) continue;
    const role = getCapability(id);
    if (role && role.lifecycle_status === "available") {
      return { kind: "role", capabilityId: id, name: role.name.replace(/\s+agent$/i, "") };
    }
  }
  return { kind: "you" };
}

/** List markers the reader understands: -, *, •, – and "1." / "1)". */
const LIST_MARKER = /^\s*(?:[-*•–]|\d+[.)])\s*/;

function clean(line: string): string {
  return line.replace(LIST_MARKER, "").replace(CHECKBOX, "").replace(/\s+/g, " ").trim();
}

function classify(text: string, raw: string): MeetingProposalKind | null {
  if (DECISION.test(text)) return "decision";
  if (text.endsWith("?") || QUESTION_PREFIX.test(text) || UNSURE.test(text)) return "question";
  if (ACTION_PREFIX.test(text) || CHECKBOX.test(raw.replace(LIST_MARKER, ""))) {
    return "action";
  }
  if (IDEA.test(text)) return "idea";
  if (ACTION.test(text)) return "action";
  return null;
}

function stripPrefix(text: string): string {
  return text
    .replace(
      /^(action|todo|to do|ai|next step|follow[- ]?up|decision|decided|agreed|question|q|open question|open|tbd|idea)\s*[:-]\s*/i,
      "",
    )
    .trim();
}

/** Read owner-supplied notes into proposals. Deterministic: the same notes give the same list. */
export function readMeetingNotes(
  notes: string,
  idFor: (index: number) => string,
): MeetingProposal[] {
  const out: MeetingProposal[] = [];
  const seen = new Set<string>();
  const lines = notes.split(/\r?\n/);
  for (let i = 0; i < lines.length && out.length < PROPOSALS_PER_MEETING_MAX; i++) {
    const raw = lines[i] ?? "";
    const text = clean(raw);
    if (text.length < 6 || /^#+\s/.test(raw.trim())) continue;
    const kind = classify(text, raw);
    if (!kind) continue;
    const body = stripPrefix(text);
    if (body.length < 4) continue;
    const key = `${kind}:${body.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: idFor(out.length),
      kind,
      text: body.length > 240 ? `${body.slice(0, 237)}…` : body,
      line: i + 1,
      owner: ownerFor(kind, body),
      status: "proposed",
      decidedAt: null,
      decidedBy: null,
    });
  }
  return out;
}

export function ownerLabel(owner: MeetingOwner): string {
  return owner.kind === "you" ? "You" : owner.name;
}

/** Everything accepted across meetings — the project's backlog from meetings. */
export function acceptedFromMeetings(
  meetings: MeetingNote[] | null | undefined,
): Array<MeetingProposal & { meetingId: string; meetingTitle: string }> {
  return (meetings ?? []).flatMap((m) =>
    m.proposals
      .filter((p) => p.status === "accepted")
      .map((p) => ({ ...p, meetingId: m.id, meetingTitle: m.title })),
  );
}

/** Markdown for the project package: the owner's notes and what they accepted from them. */
export function meetingBacklogMarkdown(meetings: MeetingNote[] | null | undefined): string | null {
  const list = meetings ?? [];
  if (!list.length) return null;
  const parts = [
    "# Meetings and the backlog from them",
    "",
    `Notes were supplied by the project owner and saved as written. Proposals were produced by the ${MEETING_READER_LABEL}; only items the owner accepted are listed as backlog. Agents do not run backlog items until the owner adds them to a plan.`,
    "",
  ];
  for (const m of list) {
    parts.push(`## ${m.title}${m.heldOn ? ` (held ${m.heldOn})` : ""}`, "");
    const accepted = m.proposals.filter((p) => p.status === "accepted");
    if (accepted.length) {
      for (const p of accepted) {
        parts.push(
          `- **${MEETING_KIND_LABEL[p.kind]}** — ${p.text} _(owner: ${ownerLabel(p.owner)}; notes line ${p.line})_`,
        );
      }
    } else {
      parts.push("_Nothing accepted from this meeting._");
    }
    parts.push(
      "",
      "<details><summary>Notes as supplied</summary>",
      "",
      m.notes,
      "",
      "</details>",
      "",
    );
  }
  return parts.join("\n");
}
