// Database-level checks against the live purchase rules (the price check and has_plan_access).
// The rules are copied onto a temporary table inside a rolled-back transaction,
// so no real purchase records are touched. Skipped when no database connection is configured.
import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

const hasDb = !!process.env["PGHOST"];

function sql(query: string): string {
  return execFileSync("psql", ["-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

let setup = "";
const USER = "00000000-0000-4000-8000-000000000001";

beforeAll(() => {
  if (!hasDb) return;
  const check = sql(
    "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'subscriptions_price_id_check'",
  );
  const body = sql(
    "SELECT prosrc FROM pg_proc WHERE proname = 'has_plan_access' AND pronamespace = 'public'::regnamespace",
  ).replace(/public\.subscriptions/g, "pg_temp.s");
  setup = `
    CREATE TEMP TABLE s (LIKE public.subscriptions INCLUDING DEFAULTS);
    ALTER TABLE pg_temp.s ADD CONSTRAINT price_check ${check};
    CREATE FUNCTION pg_temp.access(requested_user_id uuid, requested_product text, requested_environment text)
      RETURNS boolean LANGUAGE sql AS $fn$ ${body} $fn$;`;
});

function purchase(price: string, end: string) {
  return `INSERT INTO pg_temp.s (user_id, stripe_subscription_id, stripe_customer_id, product_id, price_id, status, current_period_start, current_period_end, cancel_at_period_end, environment)
    VALUES ('${USER}', 'cs_test', 'cus_test', 'prod_test', '${price}', 'active', now(), ${end}, false, 'live');`;
}

function run(body: string): string {
  return sql(
    `BEGIN; ${setup} ${body} SELECT pg_temp.access('${USER}', 'complete_journey', 'live'); ROLLBACK;`,
  )
    .split("\n")
    .filter((l) => l === "t" || l === "f")
    .join(",");
}

describe.skipIf(!hasDb)("purchase rules in the database", () => {
  it("saves a Career Sprint purchase and grants access while it is active", () => {
    expect(run(purchase("career_sprint_pass", "now() + interval '90 days'"))).toBe("t");
  });

  it("saves a Journey Annual purchase and grants access", () => {
    expect(run(purchase("complete_journey_yearly", "now() + interval '1 year'"))).toBe("t");
  });

  it("ends Career Sprint access once its 90 days have passed", () => {
    expect(run(purchase("career_sprint_pass", "now() - interval '1 second'"))).toBe("f");
  });

  it("still rejects unknown plans", () => {
    expect(() => run(purchase("made_up_plan", "now()"))).toThrow();
  });
});
