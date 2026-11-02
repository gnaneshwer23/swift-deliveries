import { describe, expect, it } from "vitest";
import { buildActivityFeed, feedTime, type FeedSource } from "./activity-feed";

const ev = (
  id: string,
  at: string,
  kind: string,
  actor: string,
  summary = "Something happened. More detail.",
) => ({
  id,
  at,
  kind,
  actor,
  summary,
});

const projects: FeedSource[] = [
  {
    id: "a",
    name: "Food waste log",
    activity: [
      ev("1", "2026-11-01T09:00:00Z", "mission.created", "human"),
      ev("2", "2026-11-01T11:00:00Z", "plan.approved", "user_123"),
      ev("3", "2026-11-01T12:00:00Z", "studio.meta_saved", "human"),
    ],
  },
  {
    id: "b",
    name: "Dog walker booking",
    activity: [
      ev("4", "2026-11-01T10:00:00Z", "research.pass.completed", "system"),
      ev(
        "5",
        "2026-11-01T13:00:00Z",
        "custom.kind",
        "DX-001",
        "Saved three supplier quotes. Then more.",
      ),
    ],
  },
];

describe("buildActivityFeed", () => {
  it("merges projects newest first, labels known kinds and hides housekeeping", () => {
    const feed = buildActivityFeed(projects);
    expect(feed.map((f) => f.key)).toEqual(["b:5", "a:2", "b:4", "a:1"]);
    expect(feed[1]).toMatchObject({ who: "You", by: "you", what: "approved the plan" });
    expect(feed[2]).toMatchObject({
      who: "DeliverX",
      by: "team",
      what: "finished the research pass",
    });
  });

  it("uses the record's own first sentence for unknown kinds and names the role", () => {
    const [first] = buildActivityFeed(projects);
    expect(first!.what).toBe("Saved three supplier quotes.");
    expect(first!.by).toBe("team");
    expect(first!.who).not.toBe("You");
  });

  it("respects the limit and skips bad timestamps", () => {
    expect(buildActivityFeed(projects, 2)).toHaveLength(2);
    expect(
      buildActivityFeed([
        { id: "x", name: "X", activity: [ev("9", "not a date", "plan.approved", "human")] },
      ]),
    ).toEqual([]);
  });
});

describe("feedTime", () => {
  const now = new Date("2026-11-02T15:00:00");
  it("shows time today, Yesterday, then a date", () => {
    expect(feedTime("2026-11-02T10:42:00", now)).toBe("10:42");
    expect(feedTime("2026-11-01T10:42:00", now)).toBe("Yesterday");
    expect(feedTime("2026-10-28T10:42:00", now)).toBe("28 Oct");
  });
});
