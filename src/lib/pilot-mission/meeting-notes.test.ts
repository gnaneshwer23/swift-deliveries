import { describe, expect, it } from "vitest";
import {
  acceptedFromMeetings,
  meetingBacklogMarkdown,
  PROPOSALS_PER_MEETING_MAX,
  readMeetingNotes,
  type MeetingNote,
} from "./meeting-notes";

const ids = (i: number) => `p${i}`;

const NOTES = `# Kick-off with two restaurant owners
- Both owners throw away bread most nights
- Action: draft interview questions for five more owners
- Decision: start with bakeries, not full restaurants
- Not sure if owners will pay monthly
- Who signs off on supplier changes?
- [ ] Wireframe the daily waste log screen
- What if we text a reminder at closing time
- I'll send the summary to Sam
- Action: draft interview questions for five more owners`;

describe("readMeetingNotes", () => {
  const out = readMeetingNotes(NOTES, ids);

  it("proposes actions, decisions, open questions and ideas, and skips context lines", () => {
    expect(out.map((p) => [p.kind, p.text])).toEqual([
      ["action", "draft interview questions for five more owners"],
      ["decision", "start with bakeries, not full restaurants"],
      ["question", "Not sure if owners will pay monthly"],
      ["question", "Who signs off on supplier changes?"],
      ["action", "Wireframe the daily waste log screen"],
      ["idea", "What if we text a reminder at closing time"],
      ["action", "I'll send the summary to Sam"],
    ]);
  });

  it("ties every proposal to the line it came from and starts it as proposed", () => {
    const lines = NOTES.split("\n");
    for (const p of out) {
      expect(lines[p.line - 1]).toContain(p.text.slice(0, 12));
      expect(p.status).toBe("proposed");
    }
  });

  it("suggests only runnable catalogue roles, and gives decisions and first-person items to you", () => {
    const by = Object.fromEntries(out.map((p) => [p.text, p.owner]));
    expect(by["draft interview questions for five more owners"]).toMatchObject({
      kind: "role",
      capabilityId: "DX-020",
    });
    expect(by["Wireframe the daily waste log screen"]).toMatchObject({ capabilityId: "DX-035" });
    expect(by["start with bakeries, not full restaurants"]).toEqual({ kind: "you" });
    expect(by["I'll send the summary to Sam"]).toEqual({ kind: "you" });
  });

  it("reads checkbox items under every list marker it understands", () => {
    const boxes = "– [ ] Book the venue\n1. [ ] Order the samples\n2) [ ] Ring the supplier";
    expect(readMeetingNotes(boxes, ids).map((p) => [p.kind, p.text])).toEqual([
      ["action", "Book the venue"],
      ["action", "Order the samples"],
      ["action", "Ring the supplier"],
    ]);
  });

  it("is deterministic and capped", () => {
    expect(readMeetingNotes(NOTES, ids)).toEqual(out);
    const many = Array.from({ length: 60 }, (_, i) => `- Action: task number ${i}`).join("\n");
    expect(readMeetingNotes(many, ids)).toHaveLength(PROPOSALS_PER_MEETING_MAX);
  });
});

describe("backlog and package", () => {
  const meeting: MeetingNote = {
    id: "m1",
    title: "Kick-off",
    heldOn: "2026-10-30",
    notes: NOTES,
    addedAt: "2026-10-31T10:00:00Z",
    addedBy: "owner",
    reader: "Notes reader (rule-based, no AI model)",
    proposals: readMeetingNotes(NOTES, ids).map((p, i) => ({
      ...p,
      status: i === 0 ? "accepted" : i === 1 ? "dismissed" : "proposed",
    })),
  };

  it("lists only accepted items as backlog", () => {
    expect(acceptedFromMeetings([meeting]).map((p) => p.id)).toEqual(["p0"]);
  });

  it("says in the package who supplied the notes and how proposals were made", () => {
    const md = meetingBacklogMarkdown([meeting])!;
    expect(md).toMatch(/supplied by the project owner/);
    expect(md).toMatch(/rule-based, no AI model/);
    expect(md).toContain("draft interview questions");
    expect(md).not.toContain("**Decision** — start with bakeries");
    expect(meetingBacklogMarkdown([])).toBeNull();
  });
});
