import { beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAuthToken } from "./verify.server";

describe("Neon identity boundary", () => {
  let pair: Awaited<ReturnType<typeof generateKeyPair>>;
  let keys: ReturnType<typeof createLocalJWKSet>;
  const issuer = "https://auth.example.test";
  const env = { NEON_AUTH_URL: `${issuer}/neondb/auth`, NEON_AUTH_AUDIENCE: "deliverx" };
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
  it("honours an explicitly configured issuer including its path", async () => {
    const customIssuer = `${issuer}/custom`;
    expect(
      (
        await verifyAuthToken(await token({ iss: customIssuer }), keys, {
          ...env,
          NEON_AUTH_ISSUER: customIssuer,
        })
      ).id,
    ).toBe("owner-1");
    await expect(
      verifyAuthToken(await token(), keys, { ...env, NEON_AUTH_ISSUER: customIssuer }),
    ).rejects.toThrow();
  });
  it.each([
    { iss: `${issuer}/neondb/auth` },
    { iss: "https://another-tenant.test" },
    { aud: "another-app" },
    { exp: 1 },
    { exp: undefined },
    { sub: undefined },
  ])("rejects invalid identity claims %j", async (claims) => {
    await expect(verifyAuthToken(await token(claims), keys, env)).rejects.toThrow();
  });
});
