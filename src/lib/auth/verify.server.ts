/**
 * Verifies Neon Auth JWTs on the server against the auth service's public
 * keys (JWKS). Server only.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

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
        const res = await fetch(url, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(5000),
        });
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
  return verifyAuthToken(token, await keySet());
}

/** Shared by the remote verifier and local-key security tests. Never trust token-supplied issuers. */
export async function verifyAuthToken(
  token: string,
  keys: JWTVerifyGetKey,
  env: Record<string, string | undefined> = process.env,
): Promise<VerifiedUser> {
  const base = env["NEON_AUTH_URL"] || env["VITE_NEON_AUTH_URL"];
  // Managed Neon Auth signs JWTs with the service origin, not /neondb/auth.
  const issuer = env["NEON_AUTH_ISSUER"] || (base ? new URL(base).origin : undefined);
  if (!issuer) throw new Error("Unauthorized: auth issuer is not configured");
  const { payload } = await jwtVerify(token, keys, {
    issuer: issuer.replace(/\/+$/, ""),
    ...(env["NEON_AUTH_AUDIENCE"] ? { audience: env["NEON_AUTH_AUDIENCE"] } : {}),
    requiredClaims: ["sub", "iss", "exp", "iat"],
    algorithms: ["RS256", "ES256", "EdDSA"],
    clockTolerance: 30,
  });
  if (!payload.sub) throw new Error("Unauthorized: token has no subject");
  return {
    id: payload.sub,
    email: typeof payload["email"] === "string" ? (payload["email"] as string) : null,
    name: typeof payload["name"] === "string" ? (payload["name"] as string) : null,
    claims: payload,
  };
}
