import { describe, expect, it } from "vitest";
import { formatAuthError } from "./auth-errors";

describe("formatAuthError", () => {
  it("explains invalid credentials", () => {
    expect(formatAuthError({ message: "Invalid login credentials" })).toMatch(/incorrect/i);
  });

  it("explains unconfirmed email", () => {
    expect(formatAuthError({ code: "email_not_confirmed", message: "Email not confirmed" })).toMatch(
      /Confirm your email/i,
    );
  });

  it("explains disabled Google provider", () => {
    expect(
      formatAuthError({ message: "Unsupported provider: provider is not enabled" }),
    ).toMatch(/Google sign-in is not enabled/i);
  });

  it("passes through unknown messages", () => {
    expect(formatAuthError({ message: "Rate limit exceeded" })).toBe("Rate limit exceeded");
  });
});
