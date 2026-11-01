import { describe, expect, it } from "vitest";
import { listCapabilities } from "@/lib/workforce/registry";
import type { ProjectSource } from "./projects-dashboard";
import { buildTeamDirectory, filterTeam } from "./team-directory";

const project = (over: Partial<ProjectSource>): ProjectSource => ({
  id: "p1",
  version: 1,
  question: "Food waste app",
  stage: "evidence",
  next: { id: "research_queued", title: "", detail: "" },
  updatedAt: "2026-10-30T10:00:00Z",
  favourite: false,
  archived: false,
  teamIds: ["DX-001", "DX-020"],
  delivery: false,
  ...over,
});

describe("buildTeamDirectory", () => {
  const dir = buildTeamDirectory([
    project({ id: "a", question: "Food waste app" }),
    project({ id: "b", question: "Old idea", archived: true, teamIds: ["DX-018"] }),
    project({ id: "c", question: "Stopped", stage: "cancelled", teamIds: ["DX-021"] }),
  ]);
  const role = (id: string) => dir.departments.flatMap((d) => d.roles).find((r) => r.id === id)!;

  it("lists every catalogue role once, with honest availability", () => {
    const all = listCapabilities();
    const roles = dir.departments.flatMap((d) => d.roles);
    expect(roles).toHaveLength(all.length);
    expect(dir.summary.canRun).toBe(all.filter((c) => c.lifecycle_status === "available").length);
    expect(role("DX-041").availability).toBe("planned");
  });

  it("puts roles only on live projects they were staffed for", () => {
    expect(role("DX-020").projects).toEqual([{ id: "a", name: "Food waste app" }]);
    expect(role("DX-018").projects).toEqual([]);
    expect(role("DX-021").projects).toEqual([]);
    expect(dir.summary.onProjects).toBe(2);
  });

  it("filters by search, department and what is working", () => {
    expect(
      filterTeam(dir, { query: "", department: "", show: "on_projects" })
        .flatMap((d) => d.roles)
        .map((r) => r.id)
        .sort(),
    ).toEqual(["DX-001", "DX-020"]);
    const canRun = filterTeam(dir, { query: "", department: "", show: "can_run" }).flatMap(
      (d) => d.roles,
    );
    expect(canRun.every((r) => r.availability === "can_run")).toBe(true);
    const research = filterTeam(dir, { query: "synthesis", department: "", show: "all" });
    expect(research.flatMap((d) => d.roles).map((r) => r.id)).toContain("DX-020");
    const dept = filterTeam(dir, {
      query: "",
      department: "Research and Intelligence",
      show: "all",
    });
    expect(dept.map((d) => d.name)).toEqual(["Research and Intelligence"]);
  });
});
