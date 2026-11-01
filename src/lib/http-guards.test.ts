import { describe, expect, it } from "vitest";
import {
  MAX_REQUEST_BODY_BYTES,
  refuseOversizedBody,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "./http-guards";

describe("withSecurityHeaders", () => {
  it("adds every header to a page response", () => {
    const res = withSecurityHeaders(new Response("<html></html>", { status: 200 }));
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(res.headers.get(name)).toBe(value);
    }
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(res.headers.get("permissions-policy")).toContain("microphone=(self)");
  });

  it("keeps a header a handler set itself", () => {
    const res = withSecurityHeaders(
      new Response("x", { headers: { "referrer-policy": "no-referrer" } }),
    );
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("copies immutable headers instead of failing", async () => {
    const original = Response.redirect("https://www.deliverx.dev/learn", 302);
    const res = withSecurityHeaders(original);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://www.deliverx.dev/learn");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });
});

describe("refuseOversizedBody", () => {
  const req = (method: string, length: number | null) =>
    new Request("https://www.deliverx.dev/_serverFn/x", {
      method,
      headers: length === null ? {} : { "content-length": String(length) },
    });

  it("refuses a declared body over the limit", () => {
    expect(refuseOversizedBody(req("POST", MAX_REQUEST_BODY_BYTES + 1))?.status).toBe(413);
  });

  it("lets normal requests through, including a 256 KB evidence upload", () => {
    expect(refuseOversizedBody(req("POST", 256 * 1024 * 2))).toBeNull();
    expect(refuseOversizedBody(req("POST", null))).toBeNull();
    expect(refuseOversizedBody(req("GET", null))).toBeNull();
  });
});
