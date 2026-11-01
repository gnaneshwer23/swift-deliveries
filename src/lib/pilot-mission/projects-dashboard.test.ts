import { describe, expect, it } from "vitest";
import { listCapabilities } from "@/lib/workforce/registry";
import {
  buildProjectsDashboard,
  filterProjects,
  projectRoles,
  type ProjectSource,
} from "./projects-dashboard";

function project(over: Partial<ProjectSource> = {}): ProjectSource {
  return {
    id: over.id ?? "p1",
    version: 1,
    question: "Help small restaurants cut food waste",
    stage: "evidence",
    next: { id: "research_queued", title: "Research is running", detail: "" },
    updatedAt: "2026-10-30T10:00:00Z",
    favourite: false,
    archived: false,
    teamIds: ["DX-001", "DX-002"],
    delivery: false,
    ...over,
  };
}

describe("buildProjectsDashboard", () => {
  it("puts each project in one plain phase", () => {
    const d = buildProjectsDashboard([
      project({ id: "a", next: { id: "decide", title: "Decide", detail: "" } }),
      project({ id: "b" }),
      project({
        id: "c",
        delivery: true,
        stage: "artefact",
        next: { id: "x", title: "", detail: "" },
      }),
      project({
        id: "d",
        stage: "exported",
        next: { id: "follow_up_approved", title: "", detail: "" },
      }),
      project({ id: "e", stage: "cancelled", next: { id: "cancelled", title: "", detail: "" } }),
    ]);
    const phase = Object.fromEntries(d.rows.map((r) => [r.id, r.phase]));
    expect(phase).toEqual({
      a: "needs_you",
      b: "researching",
      c: "building",
      d: "done",
      e: "stopped",
    });
  });

  it("counts deleted projects apart and keeps them out of every other view", () => {
    const d = buildProjectsDashboard([
      project({ id: "a" }),
      project({ id: "b", archived: true, next: { id: "decide", title: "", detail: "" } }),
    ]);
    expect(d.counts.active).toBe(1);
    expect(d.counts.needs_you).toBe(0);
    expect(d.counts.deleted).toBe(1);
    expect(filterProjects(d.rows, "active").map((r) => r.id)).toEqual(["a"]);
    expect(filterProjects(d.rows, "deleted").map((r) => r.id)).toEqual(["b"]);
  });

  it("lists favourites first, then the most recently updated", () => {
    const d = buildProjectsDashboard([
      project({ id: "old", updatedAt: "2026-10-01T00:00:00Z" }),
      project({ id: "new", updatedAt: "2026-10-31T00:00:00Z" }),
      project({ id: "fav", favourite: true, updatedAt: "2026-09-01T00:00:00Z" }),
    ]);
    expect(d.rows.map((r) => r.id)).toEqual(["fav", "new", "old"]);
  });

  it("staffs each project only with the roles it was given", () => {
    expect(projectRoles({ teamIds: ["DX-001"], delivery: false }).map((r) => r.id)).toEqual([
      "DX-001",
    ]);
    const building = projectRoles({ teamIds: ["DX-001"], delivery: true }).map((r) => r.id);
    expect(building).toContain("DX-035");
    expect(new Set(building).size).toBe(building.length);
    // Planned catalogue roles in the delivery plan (e.g. DX-041) never count as working.
    expect(building).not.toContain("DX-041");
    const available = new Set(
      listCapabilities()
        .filter((c) => c.lifecycle_status === "available")
        .map((c) => c.capability_id),
    );
    expect(building.every((id) => available.has(id))).toBe(true);
    expect(projectRoles({ teamIds: ["NOT-A-ROLE"], delivery: false })).toEqual([]);
  });

  it("reports the catalogue honestly: totals from the registry, live projects only", () => {
    const all = listCapabilities();
    const d = buildProjectsDashboard([
      project({ id: "a", teamIds: ["DX-001", "DX-002"] }),
      project({ id: "b", teamIds: ["DX-018"], archived: true }),
      project({ id: "c", teamIds: ["DX-020"], stage: "cancelled" }),
    ]);
    expect(d.team.total).toBe(all.length);
    expect(d.team.runnable).toBe(all.filter((c) => c.lifecycle_status === "available").length);
    expect(d.team.onProjects).toBe(2);
    expect(d.team.byDepartment.reduce((n, x) => n + x.total, 0)).toBe(all.length);
  });

  it("searches by project name", () => {
    const d = buildProjectsDashboard([
      project({ id: "a", question: "Food waste app" }),
      project({ id: "b", question: "Dog walking marketplace" }),
    ]);
    expect(filterProjects(d.rows, "active", "dog").map((r) => r.id)).toEqual(["b"]);
  });
});
