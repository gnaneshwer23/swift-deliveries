/**
 * Verifies Neon Auth JWTs on the server against the auth service's public
 * keys (JWKS). Server only.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let resolving: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

function authBase(): string {
  const base = process.env["NEON_AUTH_URL"] || process.env["VITE_NEON_AUTH_URL"];
  if (!base) throw new Error("Unauthorized: auth is not configured");
  return base.replace(/\/+$/, "");
}

/** The JWKS location differs across Better Auth setups; probe the known paths once. */
async function keySet() {
  if (jwks) return jwks;
  resolving ??= (async () => {
    const base = authBase();
    const candidates = [
      process.env["NEON_AUTH_JWKS_URL"],
      `${base}/.well-known/jwks.json`,
      `${base}/jwks`,
    ].filter(Boolean) as string[];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) continue;
        const body = (await res.json()) as { keys?: unknown[] };
        if (Array.isArray(body.keys) && body.keys.length) {
          jwks = createRemoteJWKSet(new URL(url));
          return jwks;
        }
      } catch {
        /* try next */
      }
    }
    resolving = null;
    throw new Error("Unauthorized: auth keys unavailable");
  })();
  return resolving;
}

export type VerifiedUser = {
  id: string;
  email: string | null;
  name: string | null;
  claims: JWTPayload;
};

export async function verifyNeonAuthToken(token: string): Promise<VerifiedUser> {
  if (!token || token.split(".").length !== 3) throw new Error("Unauthorized: invalid token");
  const { payload } = await jwtVerify(token, await keySet(), { clockTolerance: 30 });
  if (!payload.sub) throw new Error("Unauthorized: token has no subject");
  return {
    id: payload.sub,
    email: typeof payload["email"] === "string" ? (payload["email"] as string) : null,
    name: typeof payload["name"] === "string" ? (payload["name"] as string) : null,
    claims: payload,
  };
}
