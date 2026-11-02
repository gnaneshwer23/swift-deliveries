/**
 * Where Stripe may send people back to after Checkout or the billing portal.
 * DeliverX's own domains (and localhost) are always allowed. A shared hosting domain such as
 * *.vercel.app or *.lovable.app is allowed only for the exact host serving this request, so a
 * preview deployment can return to itself but no one else's deployment can be named.
 */
const SHARED_HOSTING = [".vercel.app", ".lovable.app"];

function ownDomain(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "deliverx.dev" || hostname.endsWith(".deliverx.dev")
  );
}

/** Hostname of the request being served, without a port. */
export function hostnameOf(hostHeader: string | null | undefined): string | null {
  const first = hostHeader?.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  return first.replace(/:\d+$/, "") || null;
}

/** HTTPS (or localhost) on DeliverX's own domains, or on the deployment serving the request. */
export function isAllowedReturnUrl(raw: string, requestHostname?: string | null): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" && host !== "localhost") return false;
  if (ownDomain(host)) return true;
  return (
    Boolean(requestHostname) &&
    host === requestHostname &&
    SHARED_HOSTING.some((suffix) => host.endsWith(suffix))
  );
}

/** The hostname serving the current server-function request (behind Vercel's proxy too). */
export async function currentRequestHostname(): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest()?.headers;
    return hostnameOf(headers?.get("x-forwarded-host") ?? headers?.get("host"));
  } catch {
    return null;
  }
}
