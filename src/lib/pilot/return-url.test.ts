import { describe, expect, it } from "vitest";
import { hostnameOf, isAllowedReturnUrl } from "./return-url";

describe("return URLs", () => {
  it("allows DeliverX's own domains and localhost", () => {
    expect(isAllowedReturnUrl("https://www.deliverx.dev/settings/billing")).toBe(true);
    expect(isAllowedReturnUrl("https://app.deliverx.dev/x")).toBe(true);
    expect(isAllowedReturnUrl("http://localhost:3000/x")).toBe(true);
  });

  it("refuses plain http and look-alike hosts", () => {
    expect(isAllowedReturnUrl("http://www.deliverx.dev/x")).toBe(false);
    expect(isAllowedReturnUrl("https://deliverx.dev.evil.com/x")).toBe(false);
    expect(isAllowedReturnUrl("https://evildeliverx.dev/x")).toBe(false);
    expect(isAllowedReturnUrl("not a url")).toBe(false);
  });

  it("allows a shared hosting domain only for the deployment serving the request", () => {
    const preview = "swift-deliveries-git-abc-team.vercel.app";
    expect(isAllowedReturnUrl(`https://${preview}/x`, preview)).toBe(true);
    expect(isAllowedReturnUrl("https://someone-else.vercel.app/x", preview)).toBe(false);
    expect(isAllowedReturnUrl(`https://${preview}/x`)).toBe(false);
    expect(isAllowedReturnUrl("https://other.lovable.app/x", "mine.lovable.app")).toBe(false);
    // The request host never widens beyond the shared-hosting suffixes.
    expect(isAllowedReturnUrl("https://evil.com/x", "evil.com")).toBe(false);
  });

  it("reads the hostname from a host header", () => {
    expect(hostnameOf("Preview.vercel.app:443")).toBe("preview.vercel.app");
    expect(hostnameOf("a.vercel.app, b.example")).toBe("a.vercel.app");
    expect(hostnameOf(null)).toBe(null);
  });
});
