/**
 * Browser auth via Neon Auth (managed Better Auth).
 *
 * Wraps the SDK in a small, stable surface so pages do not depend on SDK
 * details, and broadcasts a `dx-auth-change` event after every change so
 * session-aware UI can refresh.
 */
import { createInternalNeonAuth } from "@neondatabase/auth";
import { BetterAuthVanillaAdapter } from "@neondatabase/auth/vanilla";

export type AppUser = {
  id: string;
  email: string;
  /** Kept for compatibility with components that read the display name here. */
  user_metadata: { full_name?: string | undefined };
};

type Result<T = unknown> = { data: T | null; error: { message?: string; status?: number } | null };

/** The subset of the Better Auth client this app uses. */
type BetterAuthClient = {
  signUp: {
    email: (input: {
      name: string;
      email: string;
      password: string;
      callbackURL?: string;
    }) => Promise<Result>;
  };
  signIn: {
    email: (input: { email: string; password: string; callbackURL?: string }) => Promise<Result>;
    social: (input: {
      provider: string;
      callbackURL?: string;
      errorCallbackURL?: string;
    }) => Promise<Result>;
  };
  signOut: () => Promise<Result>;
  getSession: () => Promise<
    Result<{ user: { id: string; email: string; name?: string | null } } | null>
  >;
  requestPasswordReset: (input: { email: string; redirectTo?: string }) => Promise<Result>;
  resetPassword: (input: { newPassword: string; token: string }) => Promise<Result>;
  updateUser: (input: { name?: string }) => Promise<Result>;
};

export const AUTH_CHANGE_EVENT = "dx-auth-change";
const AUTH_URL = import.meta.env["VITE_NEON_AUTH_URL"] as string | undefined;

let instance: { client: BetterAuthClient; getJWTToken: () => Promise<string | null> } | null = null;

function neon() {
  if (!AUTH_URL) throw new Error("Sign-in is not configured yet. Please try again shortly.");
  if (!instance) {
    const internal = createInternalNeonAuth(AUTH_URL, { adapter: BetterAuthVanillaAdapter() });
    instance = {
      client: internal.adapter as unknown as BetterAuthClient,
      getJWTToken: internal.getJWTToken,
    };
  }
  return instance;
}

export function isAuthConfigured(): boolean {
  return !!AUTH_URL;
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function failure(result: Result): string | null {
  if (!result.error) return null;
  return result.error.message || "Something went wrong. Please try again.";
}

async function guarded(fn: () => Promise<Result>): Promise<string | null> {
  try {
    return failure(await fn());
  } catch (err) {
    return err instanceof Error ? err.message : "Something went wrong. Please try again.";
  }
}

export const auth = {
  async getUser(): Promise<AppUser | null> {
    if (!AUTH_URL || typeof window === "undefined") return null;
    try {
      const res = await neon().client.getSession();
      const u = res.data?.user;
      if (!u) return null;
      return { id: u.id, email: u.email, user_metadata: { full_name: u.name ?? undefined } };
    } catch {
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    if (!AUTH_URL || typeof window === "undefined") return null;
    try {
      return await neon().getJWTToken();
    } catch {
      return null;
    }
  },

  async signUp(input: { name: string; email: string; password: string; callbackURL: string }) {
    const err = await guarded(() => neon().client.signUp.email(input));
    if (!err) emit();
    return err;
  },

  async signIn(input: { email: string; password: string }) {
    const err = await guarded(() => neon().client.signIn.email(input));
    if (!err) emit();
    return err;
  },

  async signInWithGoogle(callbackURL: string) {
    return guarded(() =>
      neon().client.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: `${callbackURL}${callbackURL.includes("?") ? "&" : "?"}error=oauth`,
      }),
    );
  },

  async signOut() {
    const err = await guarded(() => neon().client.signOut());
    emit();
    return err;
  },

  async requestPasswordReset(email: string, redirectTo: string) {
    return guarded(() => neon().client.requestPasswordReset({ email, redirectTo }));
  },

  async resetPassword(newPassword: string, token: string) {
    return guarded(() => neon().client.resetPassword({ newPassword, token }));
  },

  async updateName(name: string) {
    const err = await guarded(() => neon().client.updateUser({ name }));
    if (!err) emit();
    return err;
  },
};
