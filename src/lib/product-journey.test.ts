import { describe, expect, it } from "vitest";
import { firstActionFor, safeProductRedirect } from "./product-journey";

describe("product entry journey", () => {
  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/career-onboarding",
    "/command/../../signup",
    "/command\n",
    undefined,
  ])("rejects unsafe or retired destinations: %s", (value) => {
    expect(safeProductRedirect(value)).toBe("/command");
  });
  it("keeps the workspace destination and drops private brief text from the address", () => {
    expect(safeProductRedirect("/command?intent=improve&prompt=checkout&idea=secret#brief")).toBe(
      "/command?intent=improve#brief",
    );
  });
  it("sends improvements to the supervised brief without putting the brief in the URL", () => {
    const action = firstActionFor({
      goal: "Improve an existing product",
      firstIdea: "Reduce drop-off & keep approvals",
    });
    const url = new URL(action.href, "https://deliverx.dev");
    expect(url.pathname).toBe("/command");
    expect(url.hash).toBe("#supervised-brief");
    expect(url.searchParams.get("prompt")).toBeNull();
    expect(action.href).not.toContain("Reduce drop-off");
  });
  it.each(["Build an MVP", "Learn by building a product", "Validate a new idea"] as const)(
    "opens the supervised brief without copying the idea into the URL for %s",
    (goal) => {
      const action = firstActionFor({ goal, firstIdea: "A tool for students" });
      const url = new URL(action.href, "https://deliverx.dev");
      expect(url.pathname).toBe("/command");
      expect(url.hash).toBe("#supervised-brief");
      expect(url.searchParams.get("idea")).toBeNull();
      expect(url.searchParams.get("prompt")).toBeNull();
      expect(action.href).not.toContain("students");
    },
  );
});
