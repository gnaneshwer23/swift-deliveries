import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn<[], Promise<{ id: string; email: string; user_metadata: {} } | null>>();
const getToken = vi.fn<[], Promise<string | null>>();

vi.mock("@/lib/auth/client", () => ({
  auth: { getUser, getToken },
}));

describe("waitForSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    getUser.mockReset();
    getToken.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns immediately when signed out", async () => {
    getUser.mockResolvedValue(null);
    const { waitForSession } = await import("./auth-session");
    await expect(waitForSession()).resolves.toBeNull();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("waits for a JWT before returning the user", async () => {
    getUser.mockResolvedValue({ id: "u1", email: "a@b.c", user_metadata: {} });
    getToken.mockResolvedValueOnce(null).mockResolvedValueOnce("jwt-token");

    const { waitForSession } = await import("./auth-session");
    const pending = waitForSession();
    await vi.advanceTimersByTimeAsync(200);
    await expect(pending).resolves.toMatchObject({ id: "u1" });
    expect(getToken).toHaveBeenCalledTimes(2);
  });
});
