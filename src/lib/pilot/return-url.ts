/** Hosts Stripe may send people back to after Checkout or the billing portal. */
export function allowedReturnHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "deliverx.dev" ||
    hostname === "www.deliverx.dev" ||
    hostname.endsWith(".deliverx.dev") ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".vercel.app")
  );
}

/** HTTPS (or localhost) on an allowed host. */
export function isAllowedReturnUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (
    (url.protocol === "https:" || url.hostname === "localhost") && allowedReturnHost(url.hostname)
  );
}
