/**
 * Product feature flags (build-time, VITE_*).
 *
 * The career suite (Experience, Launchpad, Prove, career Workspace, coaching,
 * interviews, credentials) depends on database tables that do not exist in the
 * production Supabase project. It stays off until that schema is available,
 * so no visitor can reach a page that would fail.
 */
export const CAREER_SUITE_ENABLED = import.meta.env["VITE_CAREER_SUITE_ENABLED"] === "true";
