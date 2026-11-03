import { describe, expect, it } from "vitest";
import {
  ACTIVITY_KEPT,
  auditCsv,
  buildAuditLog,
  categoryOf,
  csvCell,
  filterAudit,
  NO_FILTERS,
  type AuditEventSource,
} from "./audit-log";

const ev = (
  id: string,
  at: string,
  kind: string,
  actor = "system",
  summary = "Saved.",
): AuditEventSource => ({
  id,
  at,
  kind,
  actor,
  summary,
});

const projects = [
  {
    id: "p1",
    name: "Café waste",
    activity: [
      ev("a", "2026-11-01T09:00:00Z", "plan.proposed"),
      ev("b", "2026-11-01T10:00:00Z", "plan.approved", "owner-1"),
      ev(
        "c",
        "2026-11-02T10:00:00Z",
        "studio.meta_saved",
        "owner-1",
        "Project archived. Its work was not stopped.",
      ),
    ],
  },
  {
    id: "p2",
    name: "Tutor booking",
    activity: [
      ev("d", "2026-11-05T08:00:00Z", "pack.exported", "owner-1"),
      ev("bad", "not a date", "plan.proposed"),
    ],
  },
];

describe("audit log", () => {
  it("lists every saved event newest first, with who and what", () => {
    const log = buildAuditLog(projects);
    expect(log.entries.map((e) => e.key)).toEqual(["p2:d", "p1:c", "p1:b", "p1:a"]);
    const approved = log.entries.find((e) => e.key === "p1:b")!;
    expect(approved).toMatchObject({ who: "You", by: "you", what: "approved the plan" });
    expect(log.entries.find((e) => e.key === "p1:c")!.what).toBe("Project archived.");
    const bare = buildAuditLog([
      {
        id: "q",
        name: "Q",
        activity: [ev("x", "2026-11-01T00:00:00Z", "studio.meta_saved", "o", "")],
      },
    ]);
    expect(bare.entries[0]!.what).toBe("updated project settings");
  });

  it("files events into plain categories", () => {
    expect(categoryOf("plan.approved")).toBe("decision");
    expect(categoryOf("meeting.proposal_accepted")).toBe("decision");
    expect(categoryOf("evidence.saved")).toBe("evidence");
    expect(categoryOf("research.cited")).toBe("evidence");
    expect(categoryOf("research.pass.completed")).toBe("work");
    expect(categoryOf("pack.exported")).toBe("download");
    expect(categoryOf("studio.meta_saved")).toBe("settings");
    expect(categoryOf("something.new")).toBe("other");
  });

  it("says when a project's record is at the kept limit", () => {
    const full = Array.from({ length: ACTIVITY_KEPT }, (_, i) =>
      ev(`e${i}`, new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString(), "task.completed"),
    );
    const log = buildAuditLog([{ id: "p", name: "Busy", activity: full }, ...projects]);
    expect(log.truncatedProjects).toEqual(["Busy"]);
    expect(buildAuditLog(projects).truncatedProjects).toEqual([]);
  });

  it("filters by project, who, category, text and date range", () => {
    const { entries } = buildAuditLog(projects);
    const keys = (f: Partial<typeof NO_FILTERS>) =>
      filterAudit(entries, { ...NO_FILTERS, ...f }).map((e) => e.key);
    expect(keys({ projectId: "p2" })).toEqual(["p2:d"]);
    expect(keys({ by: "team" })).toEqual(["p1:a"]);
    expect(keys({ category: "decision" })).toEqual(["p1:b"]);
    expect(keys({ query: "tutor" })).toEqual(["p2:d"]);
    const day = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    // Two days from every other event, so the local day matches only it in any timezone.
    expect(keys({ from: day("2026-11-05T08:00:00Z"), to: day("2026-11-05T08:00:00Z") })).toEqual([
      "p2:d",
    ]);
  });

  it("writes CSV that spreadsheets cannot run as formulas", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("-1")).toBe(`"'-1"`);
    expect(csvCell("@sum")).toBe(`"'@sum"`);
    const csv = auditCsv(buildAuditLog(projects).entries);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(5);
    expect(lines[1]).toContain('"2026-11-05T08:00:00.000Z","Tutor booking","You"');
  });
});
