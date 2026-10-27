import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WfMissionTask } from "@/lib/workforce/types";

vi.mock("@/styles/plan-dependencies.css", () => ({}));
const { PlanDependencies } = await import("./plan-dependencies");

const t = (key: string, status: WfMissionTask["status"], dependsOn: string[] = []) =>
  ({
    id: `id-${key}`,
    key,
    title: `Task ${key}`,
    status,
    gate: false,
    dependsOn,
    sortOrder: 0,
    isExternal: false,
    permissionRequired: "create",
  }) as WfMissionTask;

const render = (tasks: WfMissionTask[]) =>
  renderToString(<PlanDependencies tasks={tasks} externalActionsApproved={false} />).replaceAll(
    "<!-- -->",
    "",
  );

describe("PlanDependencies", () => {
  it("shows each wave and links every task to its record", () => {
    const html = render([t("a", "completed"), t("b", "pending", ["a"])]);
    expect(html).toContain("2 waves, 1 link");
    expect(html).toContain('href="#task-id-a"');
    expect(html).toContain('href="#task-id-b"');
    expect(html).toContain("Waits on: Task a");
    expect(html).toContain("Unblocks: Task b");
    expect(html).toContain("Ready to run");
  });

  it("explains a plan it can't draw", () => {
    const html = render([t("a", "pending", ["b"]), t("b", "pending", ["a"])]);
    expect(html).toContain('role="alert"');
    expect(html).toContain("loop");
  });
});
