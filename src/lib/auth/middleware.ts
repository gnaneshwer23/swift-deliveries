import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./client";

/** Browser side: attach the Neon Auth JWT to every server-function call. */
export const attachAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = await auth.getToken();
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

/**
 * Server side: verify the caller and provide the Neon database.
 * `supabase` is kept as an alias of `db` so existing handlers compile unchanged;
 * it is the Neon query builder, not a Supabase client.
 */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const header = getRequest()?.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new Error("Unauthorized: please sign in");
  const [{ verifyNeonAuthToken }, { neonDb }] = await Promise.all([
    import("./verify.server"),
    import("@/lib/db/neon.server"),
  ]);
  const user = await verifyNeonAuthToken(header.slice(7));
  const db = neonDb();
  return next({
    context: { userId: user.id, userEmail: user.email, userName: user.name, db, supabase: db },
  });
});
