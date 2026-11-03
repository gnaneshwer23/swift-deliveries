import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LESSONS } from "./lessons";

describe("public sitemap", () => {
  const sitemap = readFileSync("public/sitemap.xml", "utf8");

  it("lists the learning hub and every lesson", () => {
    expect(sitemap).toContain("<loc>https://www.deliverx.dev/learn</loc>");
    for (const l of LESSONS) {
      expect(sitemap).toContain(`<loc>https://www.deliverx.dev/learn/${l.id}</loc>`);
    }
  });

  it("keeps the signed-in workspace out of search", () => {
    const robots = readFileSync("public/robots.txt", "utf8");
    expect(robots).toContain("Disallow: /command");
    // Signed-in pages that carry noindex stay crawlable so crawlers can read it; a
    // Disallow would hide the noindex and leave the bare URL listable.
    for (const path of ["/settings", "/profile"]) {
      expect(robots).not.toContain(`Disallow: ${path}`);
      expect(sitemap).not.toContain(path);
    }
    // A named crawler group would take precedence over "*" and drop these rules for it.
    expect(robots.match(/^User-agent:/gm)).toEqual(["User-agent:"]);
    expect(sitemap).not.toContain("/command");
  });

  it("lists every public page that sets its own search head, and only those", () => {
    const fromRoutes = new Set<string>(["/"]);
    for (const file of readdirSync("src/routes", { recursive: true, encoding: "utf8" })) {
      if (!file.endsWith(".tsx")) continue;
      const src = readFileSync(`src/routes/${file}`, "utf8");
      const m = src.match(/pageHead\(\s*"(\/[^"]*)"/);
      if (m) fromRoutes.add(m[1]!);
    }
    // Lessons share one /learn/$lessonId route, so they come from LESSONS, not route files.
    for (const l of LESSONS) fromRoutes.add(`/learn/${l.id}`);
    const inSitemap = [...sitemap.matchAll(/<loc>https:\/\/www\.deliverx\.dev([^<]*)<\/loc>/g)].map(
      (m) => m[1] || "/",
    );
    expect(new Set(inSitemap).size).toBe(inSitemap.length);
    expect([...fromRoutes].sort()).toEqual([...inSitemap].sort());
  });
});
