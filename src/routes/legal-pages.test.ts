import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pages = ["privacy", "terms", "cookies"].map((name) => ({
  name,
  source: readFileSync(`src/routes/${name}.tsx`, "utf8"),
}));

describe("legal pages", () => {
  it.each(pages)("$name uses the shared page metadata and legal frame", ({ source }) => {
    expect(source).toContain("pageHead(");
    expect(source).toContain("<LegalPage");
  });

  it.each(pages)("$name has no retired career-product wording", ({ source }) => {
    expect(source).not.toMatch(
      /attest|portfolio|credential|employment|hiring|coaching|observation features/i,
    );
  });

  it("the cookie policy does not claim analytics cookies", () => {
    const cookies = pages.find((p) => p.name === "cookies")!.source;
    expect(cookies).toContain("no analytics or advertising cookies");
    expect(cookies).not.toMatch(/analytics cookies help/i);
  });
});
