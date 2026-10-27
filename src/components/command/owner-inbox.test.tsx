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

const render = (state: Parameters<typeof OwnerInboxBody>[0]["state"]) =>
  renderToString(<OwnerInboxBody state={state} />).replaceAll("<!-- -->", "");

describe("OwnerInboxBody", () => {
  it("links each decision to the place it is made", () => {
    const html = render({
      status: "ready",
      truncated: false,
      items: [
        {
          kind: "decide_gate",
          missionId: "m1",
          missionTitle: "Meal planner",
          action: "Decide: Scope decision",
          taskId: "t1",
          hash: "task-t1",
          since: "2026-10-27T10:00:00Z",
        },
      ],
    });
    expect(html).toContain('href="/command/missions/m1#task-t1"');
    expect(html).toContain("Decide: Scope decision");
    expect(html).toContain("Stage decision");
  });

  it("says plainly when nothing is waiting, or when it couldn't check", () => {
    expect(render({ status: "ready", items: [], truncated: false })).toContain(
      "Nothing is waiting on you.",
    );
    expect(render({ status: "error" })).toContain("couldn&#x27;t be loaded");
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
