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
  it("preserves a specific product destination and its input", () => {
    expect(safeProductRedirect("/command?intent=improve&prompt=checkout#brief")).toBe(
      "/command?intent=improve&prompt=checkout#brief",
    );
  });
  it("sends improvements to the mission composer with the user's exact brief", () => {
    const action = firstActionFor({
      goal: "Improve an existing product",
      firstIdea: "Reduce drop-off & keep approvals",
    });
    const url = new URL(action.href, "https://deliverx.dev");
    expect(url.pathname).toBe("/command");
    expect(url.searchParams.get("intent")).toBe("improve");
    expect(url.searchParams.get("prompt")).toBe("Reduce drop-off & keep approvals");
  });
  it.each(["Build an MVP", "Learn by building a product", "Validate a new idea"])(
    "carries the idea into programme intake for %s",
    (goal) => {
      const action = firstActionFor({ goal, firstIdea: "A tool for students" });
      const url = new URL(action.href, "https://deliverx.dev");
      expect(url.pathname).toBe("/command/programmes");
      expect(url.searchParams.get("idea")).toBe("A tool for students");
    },
  );
});
