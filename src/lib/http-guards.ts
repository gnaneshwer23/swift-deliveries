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

const tooLarge = () =>
  new Response("Request body too large.", {
    status: 413,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });

/**
 * The request with its body read and capped, or a 413 response. Bytes are counted as they
 * arrive, so a chunked body, an undeclared length or an understated Content-Length cannot
 * get past the limit. The bytes are passed on unchanged (webhook signatures still verify).
 */
export async function limitRequestBody(request: Request): Promise<Request | Response> {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) return request;
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BODY_BYTES) return tooLarge();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return tooLarge();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  const headers = new Headers(request.headers);
  headers.set("content-length", String(total));
  headers.delete("transfer-encoding");
  const rebuilt = new Request(request.url, {
    method: request.method,
    headers,
    body,
    signal: request.signal,
  });
  return keepAdapterExtensions(request, rebuilt);
}

/**
 * The server adapter adds its own members to the request (e.g. `waitUntil`, which keeps
 * background mission work alive after the response; the client address; the platform
 * context). Carry every member a plain Request lacks onto the rebuilt one, reading through
 * to the original so methods keep their binding.
 */
function keepAdapterExtensions(original: Request, rebuilt: Request): Request {
  const source = original as unknown as Record<string, unknown>;
  // Own members, including non-enumerable ones the adapter defines with defineProperty
  // (such as `ip`), plus any enumerable ones it adds further up.
  const keys = new Set<string>(Object.getOwnPropertyNames(original));
  for (const key in source) keys.add(key);
  for (const key of keys) {
    if (key in rebuilt) continue;
    Object.defineProperty(rebuilt, key, {
      configurable: true,
      enumerable: true,
      get() {
        const value = source[key];
        return typeof value === "function"
          ? (value as (...args: unknown[]) => unknown).bind(original)
          : value;
      },
    });
  }
  return rebuilt;
}
