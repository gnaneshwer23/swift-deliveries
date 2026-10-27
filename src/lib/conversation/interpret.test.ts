import { describe, expect, it } from "vitest";
import { heardNumbers, interpret, replyFor, type ConversationContext } from "./interpret";

const ctx: ConversationContext = {
  projects: [
    { id: "p1", name: "Tutor Booking" },
    { id: "p2", name: "Parent Portal" },
  ],
  missions: [
    { id: "m1", title: "Tutor booking discovery", status: "running", projectId: "p1" },
    { id: "m2", title: "Parent portal prototype", status: "paused", projectId: "p2" },
    { id: "m3", title: "Old pricing study", status: "completed", projectId: "p1" },
  ],
};

describe("understanding a request", () => {
  it("drafts a mission from a spoken brief, naming the product", () => {
    const card = interpret(
      "Investigate why parents drop off before booking a first lesson on Tutor Booking",
      "speech",
      ctx,
    );
    expect(card).toMatchObject({
      kind: "draft_mission",
      intent: "investigate",
      product: { match: "named", projectId: "p1" },
    });
  });

  it("picks the intent from the words used", () => {
    const say = (t: string) => interpret(t, "typed", ctx);
    expect(say("Make a clickable prototype of the Parent Portal sign-up")).toMatchObject({
      intent: "prototype",
    });
    expect(say("Improve the Tutor Booking checkout so fewer people give up")).toMatchObject({
      intent: "improve",
    });
  });

  it("asks which product when none is named and there are several", () => {
    const card = interpret("Research how families choose a maths tutor", "typed", ctx);
    expect(card).toMatchObject({
      kind: "draft_mission",
      product: { match: "ambiguous", candidates: [{ id: "p1" }, { id: "p2" }] },
    });
  });

  it("asks for written confirmation of an assumed product and of numbers heard in speech", () => {
    const one: ConversationContext = { ...ctx, projects: [ctx.projects[0]!] };
    const card = interpret(
      "Find out whether thirty tutors would pay £15 a month for booking",
      "speech",
      one,
    );
    if (card.kind !== "draft_mission") throw new Error("expected a draft");
    expect(card.product).toMatchObject({ match: "only", projectId: "p1" });
    expect(card.confirm).toEqual([
      "Number heard: “out whether thirty tutors would”",
      "Number heard: “would pay £15 a month”",
      "Product: Tutor Booking",
    ]);
  });

  it("does not ask to confirm numbers that were typed", () => {
    const card = interpret(
      "Find out whether 30 tutors would pay £15 a month on Tutor Booking",
      "typed",
      ctx,
    );
    expect(card).toMatchObject({ kind: "draft_mission", confirm: [] });
  });

  it("asks for more when a request is too short to draft", () => {
    expect(interpret("tutors", "speech", ctx)).toMatchObject({ kind: "unclear" });
    expect(interpret("   ", "speech", ctx)).toMatchObject({ kind: "unclear" });
  });
});

describe("control requests", () => {
  it("never approves: a spoken approval is refused and points to the screen", () => {
    for (const t of [
      "approve the plan",
      "Approve it",
      "please sign off the scope gate",
      "go ahead and run it",
      "green light the tutor booking discovery mission",
    ]) {
      const card = interpret(t, "speech", ctx);
      expect(card.kind, t).toBe("approval_refused");
      expect(replyFor(card)).toMatch(/can't approve/);
    }
  });

  it("offers pause, cancel and resume as cards that need a click", () => {
    expect(interpret("pause the tutor booking discovery mission", "speech", ctx)).toMatchObject({
      kind: "pause",
      target: { match: "named", mission: { id: "m1" } },
    });
    expect(interpret("cancel it", "speech", { ...ctx, currentMissionId: "m1" })).toMatchObject({
      kind: "cancel",
      target: { match: "current", mission: { id: "m1" } },
    });
    // Only one mission is paused, so resume can only mean that one, shown for confirmation.
    expect(interpret("resume", "speech", ctx)).toMatchObject({
      kind: "resume",
      target: { match: "only", mission: { id: "m2" } },
    });
    expect(replyFor(interpret("cancel it", "speech", { ...ctx, currentMissionId: "m1" }))).toMatch(
      /click Cancel below\. I won't cancel it on a spoken request alone/,
    );
  });

  it("never guesses between several missions", () => {
    const busy: ConversationContext = {
      ...ctx,
      missions: [
        ...ctx.missions,
        { id: "m4", title: "Second run", status: "queued", projectId: "p1" },
      ],
    };
    expect(interpret("cancel the mission", "speech", busy)).toMatchObject({
      kind: "cancel",
      target: { match: "ambiguous", candidates: [{ id: "m1" }, { id: "m2" }, { id: "m4" }] },
    });
  });

  it("tells stopping speech apart from cancelling a mission", () => {
    expect(interpret("stop", "speech", ctx)).toEqual({ kind: "stop_speech" });
    expect(interpret("Stop talking please", "speech", ctx)).toEqual({ kind: "stop_speech" });
    expect(
      interpret("stop the mission", "speech", { ...ctx, currentMissionId: "m1" }),
    ).toMatchObject({
      kind: "cancel",
    });
    expect(replyFor({ kind: "stop_speech" })).toMatch(/missions are unchanged/);
  });

  it("does not treat a brief that mentions a control word as a control request", () => {
    for (const t of [
      "Build an app that lets members cancel their plan when it renews",
      "Prototype a way for tutors to pause lessons over the holidays",
      "Investigate an approval workflow for parents signing off lesson plans",
      "Find out why parents rarely accept the first lesson plan a tutor sends",
      "Improve how students pass the onboarding step on Tutor Booking",
      "Investigate why tutors ignore the weekly progress update email we send",
    ]) {
      expect(interpret(t, "typed", ctx).kind, t).toBe("draft_mission");
    }
  });

  it("answers a negated request with nothing to do, never a draft", () => {
    for (const t of ["don't cancel the mission", "do not put it on hold", "never approve the plan"])
      expect(interpret(t, "speech", ctx), t).toEqual({
        kind: "unclear",
        question: "Understood: I won't. Nothing has changed.",
      });
  });

  it("does not read a brief that mentions a mission's title as a control", () => {
    const withTitle: ConversationContext = {
      ...ctx,
      missions: [
        ...ctx.missions,
        { id: "m5", title: "Pause lessons", status: "running", projectId: "p1" },
      ],
    };
    expect(
      interpret("Investigate why students pause lessons over summer", "typed", withTitle).kind,
    ).toBe("draft_mission");
    expect(interpret("pause Tutor booking discovery", "speech", withTitle)).toMatchObject({
      kind: "pause",
      target: { match: "named", mission: { id: "m1" } },
    });
  });

  it("says so when the mission meant cannot take the request, and offers no button", () => {
    const card = interpret("pause the old pricing study mission", "speech", ctx);
    expect(card).toMatchObject({
      kind: "pause",
      target: { match: "ineligible", mission: { id: "m3" } },
    });
    expect(replyFor(card)).toBe(
      "“Old pricing study” (completed) can't be paused in its current state, so there's nothing to click.",
    );
    expect(interpret("resume it", "speech", { ...ctx, currentMissionId: "m1" })).toMatchObject({
      target: { match: "ineligible", mission: { id: "m1" } },
    });
    // Status applies to any mission, finished or not.
    expect(interpret("status of old pricing study", "speech", ctx)).toMatchObject({
      kind: "status",
      target: { match: "named", mission: { id: "m3" } },
    });
  });

  it("reports status for the mission in view", () => {
    expect(
      interpret("what's happening", "speech", { ...ctx, currentMissionId: "m1" }),
    ).toMatchObject({
      kind: "status",
      target: { match: "current", mission: { id: "m1" } },
    });
  });
});

describe("heard numbers", () => {
  it("keeps a little context around each number", () => {
    expect(heardNumbers("about 200 families and a 5% drop")).toEqual([
      "about 200 families and",
      "and a 5% drop",
    ]);
  });
});

describe("missions whose titles overlap", () => {
  const overlap: ConversationContext = {
    projects: ctx.projects,
    missions: [
      { id: "a", title: "Tutor", status: "running", projectId: "p1" },
      { id: "b", title: "Tutor research", status: "completed", projectId: "p1" },
    ],
  };

  it("takes the most specific title, and says when it cannot take the request", () => {
    const card = interpret("pause Tutor research", "speech", overlap);
    expect(card).toMatchObject({
      kind: "pause",
      target: { match: "ineligible", mission: { id: "b" } },
    });
    expect(interpret("pause Tutor", "speech", overlap)).toMatchObject({
      target: { match: "named", mission: { id: "a" } },
    });
  });

  it("does not claim a mission finished when it can't be approved", () => {
    const card = interpret("approve the plan for Tutor research", "speech", overlap);
    expect(replyFor(card)).toBe(
      "“Tutor research” (completed) can't be approved in its current state. In any case, I can't approve anything: approvals need an on-screen click.",
    );
  });
});
