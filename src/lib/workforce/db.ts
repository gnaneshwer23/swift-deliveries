/**
 * Untyped accessor for Stage 1 `wf_*` tables until generated Database types are refreshed.
 * Prefer this over scattering `as any` across handlers.
 */
export function wfDb(supabase: { from: (table: string) => unknown }) {
  return {
    from(table: string) {
      return supabase.from(table) as ReturnType<typeof supabase.from> & {
        select: (...args: unknown[]) => any;
        insert: (...args: unknown[]) => any;
        update: (...args: unknown[]) => any;
        upsert: (...args: unknown[]) => any;
        delete: (...args: unknown[]) => any;
      };
    },
  };
}

export function isMissingRelationError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}
