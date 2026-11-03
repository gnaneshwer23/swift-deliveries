import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildFullArchiveZip } from "./executive-pack";
import {
  OFFICE_MISSING,
  mergeOfficePackage,
  planOfficeDocuments,
  planOfficeSlides,
  renderOfficePackage,
} from "./office-package";
import { baseMission } from "./test-fixtures";

function planText(mission = baseMission()): string {
  const docs = planOfficeDocuments(mission).flatMap((doc) =>
    doc.sections.flatMap((section) => section.paragraphs),
  );
  const slides = planOfficeSlides(mission).flatMap((slide) => [slide.title, ...slide.bullets]);
  return [...docs, ...slides].join("\n");
}

describe("Chief of Staff office package", () => {
  it("plans a charter from the brief and labels missing sections", () => {
    const mission = baseMission();
    const charter = planOfficeDocuments(mission).find((doc) => doc.path.endsWith("charter.docx"));
    expect(charter?.sections.find((section) => section.title === "Question")?.paragraphs).toContain(
      mission.brief.question,
    );
    expect(
      charter?.sections.find((section) => section.title === "Constraints")?.paragraphs,
    ).toEqual([OFFICE_MISSING]);
    const prd = planOfficeDocuments(mission).find((doc) => doc.path.includes("prd"));
    expect(prd?.sections.find((section) => section.title === "Decision brief")?.paragraphs).toEqual(
      [OFFICE_MISSING],
    );
    expect(planText()).toContain("simulated draft");
    expect(planText()).toContain("DX-001");
    expect(planText()).not.toMatch(/\bVerified\b/);
    expect(planText()).not.toMatch(/[$£€]|\bUSD\b|\bGBP\b|interviewed/);
  });

  it("builds twenty slides and keeps the usage figures that are on the case", () => {
    const mission = baseMission();
    const slides = planOfficeSlides(mission);
    expect(slides).toHaveLength(20);
    const usage = slides.find((slide) => slide.title === "Usage");
    expect(usage?.bullets.join("\n")).toContain(`${mission.usageCeiling} units`);
    expect(usage?.bullets.join("\n")).toContain(`${mission.usageConsumed} units`);
    expect(usage?.bullets.join("\n")).toContain("No currency amount is recorded");
  });

  it("renders editable docx and pptx bytes and lists them on the archive index", async () => {
    const mission = baseMission({ stage: "exported", exportBody: "# Pack\n" });
    const office = await renderOfficePackage(mission);
    const docx = office.files.find((file) => file.path.endsWith(".docx"))!;
    const pptx = office.files.find((file) => file.path.endsWith(".pptx"))!;
    expect(Buffer.from(docx.base64, "base64").subarray(0, 2).toString()).toBe("PK");
    const deck = Buffer.from(pptx.base64, "base64");
    expect(deck.subarray(0, 2).toString()).toBe("PK");
    const deckXml = deck.toString("latin1");
    const slideCount = deckXml.match(/ppt\/slides\/slide\d+\.xml/g) ?? [];
    expect(new Set(slideCount).size).toBe(20);
    const charterZip = await JSZip.loadAsync(Buffer.from(docx.base64, "base64"));
    const charter = await charterZip.file("word/document.xml")!.async("string");
    expect(charter).toContain(mission.brief.question);
    expect(charter).toContain(OFFICE_MISSING);
    expect(charter).toContain("simulated draft");
    expect(charter).not.toMatch(/\bVerified\b/);

    const archive = buildFullArchiveZip(mission, "2026-11-03T00:00:00Z");
    const merged = mergeOfficePackage(archive, office);
    const index = merged.files.find((file) => file.path.endsWith("/PROJECT.md"))!.content;
    expect(index).toContain("office/01-project-charter.docx");
    expect(index).toContain("office/project-briefing.pptx");
    expect(
      merged.files.some((file) => file.encoding === "base64" && file.path.endsWith(".pptx")),
    ).toBe(true);
  });
});
