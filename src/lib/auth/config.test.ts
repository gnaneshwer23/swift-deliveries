import { describe, expect, it } from "vitest";
import { authConfigErrorMessage, getAuthConfigIssue, isAuthConfigured } from "./config";

describe("auth config", () => {
  it("flags a missing browser auth URL", () => {
    expect(getAuthConfigIssue(undefined)).toBe("missing_browser_url");
    expect(getAuthConfigIssue("")).toBe("missing_browser_url");
    expect(getAuthConfigIssue("   ")).toBe("missing_browser_url");
    expect(isAuthConfigured(undefined)).toBe(false);
  });

  it("flags an invalid browser auth URL", () => {
    expect(getAuthConfigIssue("not-a-url")).toBe("invalid_browser_url");
    expect(isAuthConfigured("not-a-url")).toBe(false);
  });

  it("accepts a valid Neon Auth base URL", () => {
    const url = "https://ep-example.neonauth.eu-west-2.aws.neon.tech/neondb/auth";
    expect(getAuthConfigIssue(url)).toBeNull();
    expect(isAuthConfigured(url)).toBe(true);
  });

  it("names VITE_NEON_AUTH_URL in setup guidance", () => {
    expect(authConfigErrorMessage("missing_browser_url")).toMatch(/VITE_NEON_AUTH_URL/i);
    expect(authConfigErrorMessage("invalid_browser_url")).toMatch(/VITE_NEON_AUTH_URL/i);
  });
});
