import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import type { DxProfile } from "@/lib/dx-profile";

function mapProfile(row: any): DxProfile | null {
  if (!row?.completed_at) return null;
  return {
    fullName: row.full_name ?? "",
    role: row.role ?? "",
    teamSize: row.team_size ?? "",
    goal: row.goal ?? "",
    firstIdea: row.first_idea ?? "",
    completedAt: row.completed_at,
  };
}

/** The signed-in user's onboarding profile, or null when setup is unfinished. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<DxProfile | null> => {
    const res = await context.db
      .from("dx_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return mapProfile(res.data);
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(80),
        role: z.string().trim().min(1).max(60),
        teamSize: z.string().trim().min(1).max(20),
        goal: z.string().trim().min(1).max(60),
        firstIdea: z.string().trim().max(1000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<DxProfile> => {
    const now = new Date().toISOString();
    const res = await context.db
      .from("dx_profiles")
      .upsert(
        {
          user_id: context.userId,
          full_name: data.fullName,
          role: data.role,
          team_size: data.teamSize,
          goal: data.goal,
          first_idea: data.firstIdea,
          completed_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (res.error) throw new Error(res.error.message);
    return mapProfile(res.data)!;
  });
