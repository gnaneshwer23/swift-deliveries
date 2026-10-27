import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    hash,
  }: {
    children: unknown;
    params: { missionId: string };
    hash?: string;
  }) => (
    <a href={`/command/missions/${params.missionId}${hash ? `#${hash}` : ""}`}>
      {children as never}
    </a>
  ),
}));
vi.mock("@/lib/workforce-queries", () => ({ ownerInboxQuery: {} }));
const { OwnerInboxBody } = await import("./owner-inbox");
type InboxItem = import("@/lib/workforce/owner-inbox").InboxItem;

const render = (state: Parameters<typeof OwnerInboxBody>[0]["state"]) =>
  renderToString(<OwnerInboxBody state={state} />).replaceAll("<!-- -->", "");

describe("OwnerInboxBody", () => {
  it("links every kind of decision to the place it is made", () => {
    const kinds: Array<[InboxItem["kind"], string, string]> = [
      ["decide_gate", "task-t1", "Stage decision"],
      ["approve_external", "task-t2", "Outside action to approve"],
      ["approve_plan", "mission-plan", "Plan to approve"],
      ["answer_questions", "mission-clarify", "Questions to answer"],
      ["finish_request", "", "Request to finish"],
      ["resume", "mission-tasks", "Paused by you"],
    ];
    const html = render({
      status: "ready",
      truncated: false,
      items: kinds.map(([kind, hash], n) => ({
        kind,
        missionId: `m${n}`,
        missionTitle: "Meal planner",
        action: `Do ${kind}`,
        taskId: hash.startsWith("task-") ? hash.slice(5) : null,
        hash,
        since: "2026-10-27T10:00:00Z",
      })),
    });
    kinds.forEach(([kind, hash, label], n) => {
      expect(html).toContain(`href="/command/missions/m${n}${hash ? `#${hash}` : ""}"`);
      expect(html).toContain(`Do ${kind}`);
      expect(html).toContain(label);
    });
  });

  it("says plainly when nothing is waiting, or when it couldn't check", () => {
    expect(render({ status: "ready", items: [], truncated: false })).toContain(
      "Nothing is waiting on you.",
    );
    expect(render({ status: "error" })).toContain("couldn&#x27;t be loaded");
    expect(render({ status: "error" })).toContain('role="alert"');
  });

  it("names a cut-off list even when nothing in it is waiting", () => {
    const html = render({ status: "ready", items: [], truncated: true });
    expect(html).toContain("Nothing is waiting on you in the 200 longest-waiting open missions.");
    expect(html).toContain("200 longest-waiting open missions only");
  });

  it("names a cut-off list instead of dropping missions silently", () => {
    expect(
      render({
        status: "ready",
        truncated: true,
        items: [
          {
            kind: "resume",
            missionId: "m2",
            missionTitle: "X",
            action: "Resume or cancel the mission",
            taskId: null,
            hash: "mission-tasks",
            since: "2026-10-27T10:00:00Z",
          },
        ],
      }),
    ).toContain("200 longest-waiting open missions only");
  });
});
