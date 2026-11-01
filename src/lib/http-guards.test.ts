import { describe, expect, it } from "vitest";
import {
  MAX_REQUEST_BODY_BYTES,
  limitRequestBody,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "./http-guards";

describe("withSecurityHeaders", () => {
  it("adds every header to a page response", () => {
    // Written out here so that dropping or weakening a header in the module fails this test.
    const required = {
      "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "microphone=(self), camera=(), geolocation=(), payment=(), usb=()",
    };
    expect(SECURITY_HEADERS).toEqual(required);
    const res = withSecurityHeaders(new Response("<html></html>", { status: 200 }));
    for (const [name, value] of Object.entries(required)) {
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

describe("limitRequestBody", () => {
  const url = "https://www.deliverx.dev/_serverFn/x";
  const streamOf = (sizes: number[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const n of sizes) c.enqueue(new Uint8Array(n).fill(97));
        c.close();
      },
    });
  const post = (body: BodyInit, headers: Record<string, string> = {}) =>
    new Request(url, { method: "POST", body, headers, duplex: "half" } as RequestInit);

  it("refuses a declared body over the limit without reading it", async () => {
    let pulled = false;
    // highWaterMark 0: nothing is pulled until someone actually reads.
    const untouched = new ReadableStream<Uint8Array>(
      {
        pull() {
          pulled = true;
          throw new Error("the body must not be read");
        },
      },
      { highWaterMark: 0 },
    );
    const res = await limitRequestBody(
      post(untouched, { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) }),
    );
    expect(pulled).toBe(false);
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(413);
  });

  it("refuses a chunked body with no declared length once it passes the limit", async () => {
    const half = MAX_REQUEST_BODY_BYTES / 2;
    const res = await limitRequestBody(post(streamOf([half, half, 10])));
    expect((res as Response).status).toBe(413);
  });

  it("refuses a body whose declared length understates it", async () => {
    const res = await limitRequestBody(
      post(streamOf([MAX_REQUEST_BODY_BYTES, 1]), { "content-length": "10" }),
    );
    expect((res as Response).status).toBe(413);
  });

  it("passes a normal body through byte for byte", async () => {
    const payload = JSON.stringify({ note: "é".repeat(1000), file: "x".repeat(256 * 1024) });
    const out = await limitRequestBody(
      post(payload, { "content-type": "application/json", "stripe-signature": "t=1,v1=abc" }),
    );
    expect(out).toBeInstanceOf(Request);
    const req = out as Request;
    expect(await req.text()).toBe(payload);
    expect(req.method).toBe("POST");
    expect(req.headers.get("stripe-signature")).toBe("t=1,v1=abc");
    expect(req.headers.get("content-length")).toBe(
      String(new TextEncoder().encode(payload).length),
    );
  });

  it("keeps adapter members such as waitUntil on the rebuilt request", async () => {
    const original = post("{}") as Request & {
      waitUntil?: (p: Promise<unknown>) => void;
      ip?: string;
    };
    const kept: Array<Promise<unknown>> = [];
    const receivers: unknown[] = [];
    original.waitUntil = function (this: unknown, p: Promise<unknown>) {
      receivers.push(this);
      kept.push(p);
    };
    // As the Vercel adapter does: waitUntil assigned, ip defined as a non-enumerable getter.
    Object.defineProperty(original, "ip", { get: () => "203.0.113.7" });
    const out = (await limitRequestBody(original)) as typeof original;
    expect(out).not.toBe(original);
    const work = Promise.resolve("done");
    out.waitUntil?.(work);
    expect(kept).toEqual([work]);
    expect(receivers).toEqual([original]);
    expect(out.ip).toBe("203.0.113.7");
    expect(await out.text()).toBe("{}");
  });

  it("leaves GET requests untouched", async () => {
    const get = new Request(url);
    expect(await limitRequestBody(get)).toBe(get);
  });
});
