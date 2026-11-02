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

describe("owner-confirmed legal details (2 November 2026)", () => {
  const privacy = readFileSync("src/routes/privacy.tsx", "utf8");
  const terms = readFileSync("src/routes/terms.tsx", "utf8");

  it("names DeliverX as a trading name, not a registered company", () => {
    for (const s of [privacy, terms]) {
      expect(s).toContain("DeliverX is the trading name of Gnaneshwer Jadav");
      expect(s).toContain("DeliverX is not");
      expect(s).not.toMatch(/being established/);
    }
  });

  it("states the transfer safeguards and the refund terms", () => {
    expect(privacy).toContain("International Data Transfer Addendum");
    expect(terms).toContain("within 3 days of a payment");
    expect(terms).toContain("legal right to cancel within 14 days");
    expect(terms).toContain("except where the consumer right below applies");
  });
});
