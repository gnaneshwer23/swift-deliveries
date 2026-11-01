/**
 * Browser security headers added to every page and server response (see src/server.ts).
 *
 * The content policy is limited to directives that cannot break page scripts, sign-in,
 * fonts, voice or the sandboxed prototype frames: it stops other sites framing DeliverX,
 * plugin content and base-URL hijacking. Script and connect sources are not restricted here.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  // Voice input asks for the microphone on this site only; nothing else is used.
  "permissions-policy": "microphone=(self), camera=(), geolocation=(), payment=(), usb=()",
};

function fill(headers: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
}

/** The response with the security headers set, keeping any a handler already set. */
export function withSecurityHeaders(response: Response): Response {
  try {
    fill(response.headers);
    return response;
  } catch {
    // Some responses (e.g. a proxied fetch) have immutable headers: copy them.
    const headers = new Headers(response.headers);
    fill(headers);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

/**
 * Largest request body accepted. The biggest legitimate input is a 256 KB evidence file;
 * this leaves ample room for JSON encoding. Refusing oversized bodies before validation also
 * keeps a known memory-exhaustion issue in the validation library out of reach.
 */
export const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;

/** A 413 response when the declared body is too large, otherwise null. */
export function refuseOversizedBody(request: Request): Response | null {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(declared) || declared <= MAX_REQUEST_BODY_BYTES) return null;
  return new Response("Request body too large.", {
    status: 413,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
