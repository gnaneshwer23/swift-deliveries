import { readFileSync } from "node:fs";
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
    // A named crawler group would take precedence over "*" and drop these rules for it.
    expect(robots.match(/^User-agent:/gm)).toEqual(["User-agent:"]);
    expect(sitemap).not.toContain("/command");
  });
});
