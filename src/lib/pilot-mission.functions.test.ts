import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Static guards for supervised mission server functions — auth and workspace binding
 * without a browser or live Neon (see docs/psi-phase-1-independent-verification.md §5).
 */
describe("supervised mission server functions — auth and workspace scoping", () => {
  const source = readFileSync(new URL("./pilot-mission.functions.ts", import.meta.url), "utf8");
  const handlers = [
    ...source.matchAll(/export const (\w+) = createServerFn[\s\S]*?(?=\nexport const |\n*$)/g),
  ].map((m) => ({ name: m[1]!, body: m[0] }));

  it("finds the exported handlers it guards", () => {
    expect(handlers.length).toBeGreaterThanOrEqual(20);
  });

  it.each(handlers.map((h) => [h.name, h.body] as const))(
    "%s requires auth before handling",
    (_name, body) => {
      expect(body).toMatch(/\.middleware\(\[requireAuth\]\)/);
    },
  );

  it.each(
    handlers
      .filter((h) => /async \(\{ context, data \}\)/.test(h.body))
      .map((h) => [h.name, h.body] as const),
  )("%s resolves workspace from auth, not client workspaceId", (_name, body) => {
    const workspaceResolve = body.indexOf("workspaceFor(context.supabase, context.userId)");
    expect(workspaceResolve).toBeGreaterThan(-1);
    const scopedRead = body.search(
      /workspaceId: workspace\.id|service\.get\(workspace\.id|\.eq\("workspace_id", workspace\.id\)/,
    );
    expect(scopedRead).toBeGreaterThan(workspaceResolve);
    expect(body).not.toMatch(/data\.workspaceId/);
  });

  it("mutation validators do not accept a client-supplied workspace id", () => {
    const validatorBlocks = [...source.matchAll(/\.validator\([\s\S]*?\)\s*\n\s*\.handler/g)].map(
      (m) => m[0],
    );
    for (const block of validatorBlocks) {
      expect(block).not.toMatch(/workspaceId:\s*z\./);
    }
  });
});
