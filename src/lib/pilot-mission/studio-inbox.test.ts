import { describe, expect, it } from "vitest";
import { buildStudioInbox, type StudioInboxMissionRow } from "./studio-inbox";

function row(partial: Partial<StudioInboxMissionRow> & Pick<StudioInboxMissionRow, "id">): StudioInboxMissionRow {
  return {
    question: "Test question",
    next: { id: "decide", title: "Record path", detail: "Choose next step." },
    nextTitle: "Record path",
    updatedAt: "2026-10-28",
    ...partial,
  };
}

describe("Phase 4 studio inbox", () => {
  it("deduplicates duplicate mission rows to one inbox item", () => {
    const a = row({ id: "m1" });
    const inbox = buildStudioInbox([a, { ...a }, row({ id: "m2", next: { id: "evidence", title: "Add evidence", detail: "Optional." } })]);
    expect(inbox.map((i) => i.missionId)).toEqual(["m1", "m2"]);
    expect(inbox.filter((i) => i.missionId === "m1")).toHaveLength(1);
  });

  it("orders owner gates ahead of routine steps", () => {
    const inbox = buildStudioInbox([
      row({ id: "evidence", next: { id: "evidence", title: "Add", detail: "Optional." }, nextTitle: "Add" }),
      row({ id: "decide", updatedAt: "2026-10-20" }),
    ]);
    expect(inbox[0]?.missionId).toBe("decide");
  });

  it("merges pause and open-question signals without duplicate rows", () => {
    const inbox = buildStudioInbox([
      row({
        id: "m1",
        investigationPaused: true,
        openQuestionCount: 2,
        next: { id: "compare", title: "Compare", detail: "Run comparison." },
        nextTitle: "Compare",
      }),
    ]);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.kinds).toEqual(expect.arrayContaining(["gate", "paused", "open_questions"]));
    expect(inbox[0]?.detail).toContain("paused");
    expect(inbox[0]?.detail).toContain("2 open questions");
  });

  it("skips terminal and in-progress-only comparison rows", () => {
    const inbox = buildStudioInbox([
      row({ id: "done", next: { id: "cancelled", title: "Cancelled", detail: "" }, nextTitle: "Cancelled" }),
      row({ id: "run", next: { id: "recover", title: "Running", detail: "Worker owns step." }, nextTitle: "Running" }),
    ]);
    expect(inbox).toHaveLength(0);
  });
});
