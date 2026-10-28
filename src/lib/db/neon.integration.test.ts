import { afterAll, describe, expect, it } from "vitest";
import { createDb, toParam, type ColumnTypes } from "./builder";
import { neonDb } from "./neon.server";

const live = !!process.env["DATABASE_URL"];

describe("builder (no database)", () => {
  const types: ColumnTypes = new Map([
    [
      "t",
      new Map([
        ["id", "uuid"],
        ["name", "text"],
        ["tags", "text[]"],
        ["meta", "jsonb"],
        ["n", "int4"],
      ]),
    ],
  ]);
  const seen: Array<{ text: string; params: string[] }> = [];
  const db = createDb(
    async (text, params) => {
      seen.push({ text, params });
      return [];
    },
    async () => types,
  );

  it("parameterises and casts every value", async () => {
    await db
      .from("t")
      .select("id, name")
      .eq("name", "x'; drop table t;--")
      .in("n", [1, 2])
      .order("n", { ascending: false })
      .limit(5);
    expect(seen.at(-1)).toEqual({
      text: 'select "id", "name" from "t" where "name" = $1::text and "n" in ($2::int4, $3::int4) order by "n" desc limit 5',
      params: ["x'; drop table t;--", "1", "2"],
    });
  });

  it("rejects unknown columns and unsafe identifiers", async () => {
    expect((await db.from("t").select("nope")).error?.message).toMatch(/Unknown column/);
    expect(() => db.from("t; drop")).toThrow(/Invalid identifier/);
  });

  it("refuses unfiltered updates and deletes", async () => {
    expect((await db.from("t").update({ n: 1 })).error?.message).toMatch(/without a filter/);
    expect((await db.from("t").delete()).error?.message).toMatch(/without a filter/);
  });

  it("serialises arrays and json for their column types", () => {
    expect(toParam(["a", 'b"c'], "text[]")).toBe('{"a","b\\"c"}');
    expect(toParam({ a: [1] }, "jsonb")).toBe('{"a":[1]}');
    expect(toParam(["x"], "jsonb")).toBe('["x"]');
    expect(toParam(null, "text")).toBeNull();
  });
});

describe.skipIf(!live)("Neon integration", () => {
  const db = live ? neonDb() : (null as never);
  const owner = `test-${Date.now()}`;
  let workspaceId = "";

  afterAll(async () => {
    if (workspaceId) await db.from("wf_workspaces").delete().eq("id", workspaceId);
  });

  it("round-trips the workforce data model", async () => {
    const ws = await db
      .from("wf_workspaces")
      .insert({ owner_id: owner, usage_ceiling: 100 })
      .select("*")
      .single();
    expect(ws.error).toBeNull();
    workspaceId = ws.data.id;
    expect(typeof ws.data.created_at).toBe("string");
    expect(ws.data.created_at).toMatch(/Z$/);

    const project = await db
      .from("wf_projects")
      .insert({ workspace_id: workspaceId, name: "P", created_by: owner })
      .select("*")
      .single();
    const mission = await db
      .from("wf_missions")
      .insert({
        workspace_id: workspaceId,
        project_id: project.data.id,
        intent: "build",
        title: "M",
        request_text: "r",
        status: "queued",
        clarification_answers: { users: "freelancers" },
        created_by: owner,
      })
      .select("*")
      .single();
    expect(mission.error).toBeNull();
    expect(mission.data.clarification_answers).toEqual({ users: "freelancers" });

    const plan = {
      mission_id: mission.data.id,
      workspace_id: workspaceId,
      summary: "s1",
      required_permission: "plan",
      acceptance_criteria: ["a", "b"],
    };
    expect(
      (await db.from("wf_mission_plans").upsert(plan, { onConflict: "mission_id" })).error,
    ).toBeNull();
    expect(
      (
        await db
          .from("wf_mission_plans")
          .upsert({ ...plan, summary: "s2" }, { onConflict: "mission_id" })
      ).error,
    ).toBeNull();
    const plans = await db
      .from("wf_mission_plans")
      .select("summary, acceptance_criteria")
      .eq("mission_id", mission.data.id);
    expect(plans.data).toEqual([{ summary: "s2", acceptance_criteria: ["a", "b"] }]);

    const art = await db
      .from("wf_artefacts")
      .insert({
        mission_id: mission.data.id,
        workspace_id: workspaceId,
        kind: "prd",
        title: "T",
        content: "C",
        quality_labels: ["agent_reviewed", "human_reviewed"],
      })
      .select("quality_labels")
      .single();
    expect(art.data.quality_labels).toEqual(["agent_reviewed", "human_reviewed"]);

    const claimed = await db
      .from("wf_missions")
      .update({ status: "running" })
      .eq("id", mission.data.id)
      .in("status", ["queued", "blocked"])
      .select("id");
    expect(claimed.data).toHaveLength(1);
    const again = await db
      .from("wf_missions")
      .update({ status: "running" })
      .eq("id", mission.data.id)
      .in("status", ["queued", "blocked"])
      .select("id");
    expect(again.data).toHaveLength(0);

    const none = await db
      .from("wf_missions")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();
    expect(none).toMatchObject({ data: null, error: null });
    expect(
      (await db.from("wf_missions").select("*").eq("workspace_id", workspaceId).single()).error,
    ).toBeNull();

    const count = await db
      .from("monitoring_events")
      .select("id", { count: "exact", head: true })
      .limit(1);
    expect(count.error).toBeNull();
    expect(typeof count.count).toBe("number");

    expect((await db.rpc("wf_schema_version")).data).toBe(4);
  });

  it("keeps programme records append-only", async () => {
    const prog = await db
      .from("wf_programmes")
      .insert({
        workspace_id: workspaceId,
        created_by: owner,
        title: "X",
        business_case: {},
        state: {},
        budget_ceiling: 100,
      })
      .select("id")
      .single();
    const rec = await db
      .from("wf_programme_records")
      .insert({
        programme_id: prog.data.id,
        workspace_id: workspaceId,
        kind: "event",
        title: "t",
        actor: owner,
      })
      .select("id")
      .single();
    const upd = await db
      .from("wf_programme_records")
      .update({ title: "changed" })
      .eq("id", rec.data.id);
    expect(upd.error?.message).toMatch(/append-only/);
  });
});
