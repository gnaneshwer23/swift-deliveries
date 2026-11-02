import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/learn/lessons";
import {
  breadcrumbs,
  faqPage,
  jsonLdScript,
  learnCourse,
  learnLesson,
  productOffers,
} from "./structured-data";

describe("structured data", () => {
  it("builds a breadcrumb trail starting at home", () => {
    const b = breadcrumbs([["Learn", "/learn"]]) as { itemListElement: { item: string }[] };
    expect(b.itemListElement.map((i) => i.item)).toEqual([
      "https://www.deliverx.dev/",
      "https://www.deliverx.dev/learn",
    ]);
  });

  it("publishes the monthly GBP prices and claims no availability or rating", () => {
    const p = productOffers([{ id: "builder", name: "Builder", price: 29, focus: "One." }]);
    const text = JSON.stringify(p);
    expect(text).toContain('"price":"29.00"');
    expect(text).toContain('"priceCurrency":"GBP"');
    const spec = (p as { offers: { priceSpecification: Record<string, unknown> }[] }).offers[0]!
      .priceSpecification;
    expect(spec).toMatchObject({ price: "29.00", priceCurrency: "GBP", unitCode: "MON" });
    expect((p as { "@type": string[] })["@type"]).toEqual(["SoftwareApplication", "Product"]);
    expect(text).not.toMatch(/availability|aggregateRating|review/i);
  });

  it("maps FAQ items to questions with accepted answers", () => {
    const f = faqPage([{ q: "Q?", a: "A." }]) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(f.mainEntity[0]).toMatchObject({ name: "Q?", acceptedAnswer: { text: "A." } });
  });

  it("links every lesson to the course and back", () => {
    const course = learnCourse(LESSONS, "d") as { hasPart: { "@id": string }[] };
    const ids = LESSONS.map((l) => `https://www.deliverx.dev/learn/${l.id}#lesson`);
    expect(course.hasPart.map((p) => p["@id"])).toEqual(ids);
    for (const lesson of LESSONS) {
      const node = learnLesson(lesson) as { "@id": string; isPartOf: { "@id": string } };
      expect(node["@id"]).toBe(`https://www.deliverx.dev/learn/${lesson.id}#lesson`);
      expect(node.isPartOf["@id"]).toBe("https://www.deliverx.dev/learn#course");
    }
  });

  it("escapes < so page text cannot close the script tag", () => {
    const s = jsonLdScript([faqPage([{ q: "</script><b>", a: "x" }])]);
    expect(s.type).toBe("application/ld+json");
    expect(s.children).not.toContain("</script>");
    expect(JSON.parse(s.children)["@graph"][0].mainEntity[0].name).toBe("</script><b>");
  });
});
