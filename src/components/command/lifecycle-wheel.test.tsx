import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WfArtefact, WfMissionTask } from "@/lib/workforce/types";

vi.mock("@/styles/lifecycle-wheel.css", () => ({}));
const { LifecycleWheel } = await import("./lifecycle-wheel");

const task = (key: string, stage: WfMissionTask["stage"], status: WfMissionTask["status"]) =>
  ({
    id: `id-${key}`,
    key,
    stage,
    status,
    gate: key.startsWith("gate_"),
    title: `Task ${key}`,
  }) as WfMissionTask;

const render = (tasks: WfMissionTask[], artefacts: WfArtefact[] = []) =>
  renderToString(
    <LifecycleWheel tasks={tasks} artefacts={artefacts} onOpenArtefact={() => {}} />,
  ).replaceAll("<!-- -->", "");

describe("LifecycleWheel", () => {
  it("opens on the waiting decision and links each task to its record", () => {
    const html = render(
      [
        task("charter", "capture", "completed"),
        task("prd", "define", "completed"),
        task("gate_scope", "define", "blocked"),
      ],
      [{ id: "a1", taskId: "id-prd", title: "PRD v1" } as WfArtefact],
    );
    expect(html).toContain("Stage 5 of 12");
    for (const key of ["charter", "prd", "gate_scope"])
      expect(html).toContain(`href="#task-id-${key}"`);
    expect(html).toContain("Awaiting your decision");
    expect(html).toContain("Open PRD v1");
    expect(html).toContain("wheel-v1");
  });

  it("shows untouched stages as not started, never as moving", () => {
    const html = render([task("charter", "capture", "pending")]);
    expect(html).toContain("12. Learn: Not started");
    // The key names every state; no stage claims one it isn't in.
    expect(html).not.toMatch(/aria-label="\d+\. \w+: In progress"/);
    expect(html).not.toMatch(/aria-label="\d+\. \w+: Complete"/);
  });

  it("offers the same stages as a list, in order", () => {
    const html = render([task("charter", "capture", "running")]);
    const list = html.slice(html.indexOf('aria-label="Lifecycle stages"'));
    expect(list.indexOf("1. Capture")).toBeLessThan(list.indexOf("12. Learn"));
    expect(list).toContain("In progress");
  });
});
