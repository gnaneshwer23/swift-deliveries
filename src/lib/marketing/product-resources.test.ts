import { describe, expect, it } from "vitest";
import { briefMarkdown, EMPTY_BRIEF, EXAMPLE_BRIEF, RESOURCE_TEMPLATES } from "./product-resources";
describe("portable product resources", () => {
  it("keeps the user's problem and evidence in the exported brief", () => {
    const text = briefMarkdown(EXAMPLE_BRIEF);
    expect(text).toContain(EXAMPLE_BRIEF.problem);
    expect(text).toContain(EXAMPLE_BRIEF.evidence);
    expect(text).toContain("user input, not validated research");
  });
  it("marks missing information rather than manufacturing research", () => {
    const text = briefMarkdown(EMPTY_BRIEF);
    expect(text).toContain("Untitled product");
    expect(text).toContain("Not supplied — clarify before starting.");
  });
  it("gives every downloadable template actual editable content", () => {
    expect(new Set(RESOURCE_TEMPLATES.map((template) => template.key)).size).toBe(3);
    for (const template of RESOURCE_TEMPLATES) {
      expect(template.body.startsWith("# ")).toBe(true);
      expect(template.body).toContain("## ");
    }
    expect(RESOURCE_TEMPLATES.find((template) => template.key === "experiment")?.body).toContain(
      "Leave blank until an actual observation exists.",
    );
  });
});
