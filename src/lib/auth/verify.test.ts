import { beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAuthToken } from "./verify.server";

describe("Neon identity boundary", () => {
  let pair: Awaited<ReturnType<typeof generateKeyPair>>;
  let keys: ReturnType<typeof createLocalJWKSet>;
  const issuer = "https://auth.example.test/neondb/auth";
  const env = { NEON_AUTH_URL: issuer, NEON_AUTH_AUDIENCE: "deliverx" };
  beforeAll(async () => {
    pair = await generateKeyPair("RS256");
    keys = createLocalJWKSet({
      keys: [{ ...(await exportJWK(pair.publicKey)), kid: "test", alg: "RS256" }],
    });
  });
  async function token(overrides: Record<string, unknown> = {}) {
    return new SignJWT({
      sub: "owner-1",
      iss: issuer,
      aud: "deliverx",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .sign(pair.privateKey);
  }
  it("accepts a signed, scoped, expiring token", async () => {
    expect((await verifyAuthToken(await token(), keys, env)).id).toBe("owner-1");
  });
  it.each([
    { iss: "https://another-tenant.test" },
    { aud: "another-app" },
    { exp: 1 },
    { exp: undefined },
    { sub: undefined },
  ])("rejects invalid identity claims %j", async (claims) => {
    await expect(verifyAuthToken(await token(claims), keys, env)).rejects.toThrow();
  });
});
