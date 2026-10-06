// Database-level checks: runs inside a transaction that is always rolled back.
// Skipped when no database connection is configured.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const hasDb = !!process.env["PGHOST"];

function sql(query: string): string {
  return execFileSync("psql", ["-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], {
    encoding: "utf8",
  }).trim();
}

const insert = (price: string, end: string) => `
  INSERT INTO public.subscriptions (user_id, stripe_subscription_id, stripe_customer_id, product_id, price_id, status, current_period_start, current_period_end, cancel_at_period_end, environment)
  SELECT id, 'test_' || gen_random_uuid(), 'cus_test', 'prod_test', '${price}', 'active', now(), ${end}, false, 'test_env'
  FROM auth.users ORDER BY created_at LIMIT 1;`;

const access = `(SELECT public.has_plan_access((SELECT id FROM auth.users ORDER BY created_at LIMIT 1), 'complete_journey', 'test_env'))`;

function inRollback(body: string): string {
  const out = sql(`BEGIN; DELETE FROM public.subscriptions WHERE environment = 'test_env'; ${body} ROLLBACK;`);
  return out.split("\n").filter((l) => l === "t" || l === "f").join(",");
}

describe.skipIf(!hasDb)("plan access in the database", () => {
  it("saves a Career Sprint purchase and grants access while it is active", () => {
    expect(inRollback(`${insert("career_sprint_pass", "now() + interval '90 days'")} SELECT ${access};`)).toBe("t");
  });

  it("saves a Journey Annual purchase and grants access", () => {
    expect(inRollback(`${insert("complete_journey_yearly", "now() + interval '1 year'")} SELECT ${access};`)).toBe("t");
  });

  it("ends Career Sprint access after its 90 days", () => {
    expect(inRollback(`${insert("career_sprint_pass", "now() - interval '1 day'")} SELECT ${access};`)).toBe("f");
  });
});
