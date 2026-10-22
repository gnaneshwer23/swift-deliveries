/**
 * DeliverX onboarding profile, stored on the user's own auth record
 * (`user_metadata.dx_profile`) — no extra tables, owner-only by design.
 */
import type { User } from "@supabase/supabase-js";

export const DX_ROLES = [
  "Founder",
  "Product manager",
  "Product or design lead",
  "Engineering lead",
  "Consultant or agency",
  "Other",
] as const;
export const DX_TEAM_SIZES = ["Just me", "2–10", "11–50", "51–250", "250+"] as const;
export const DX_GOALS = [
  "Validate a new idea",
  "Build an MVP",
  "Improve an existing product",
  "Explore what's possible",
] as const;

export type DxProfile = {
  role: string;
  teamSize: string;
  goal: string;
  firstIdea: string;
  completedAt: string;
};

export function dxProfileOf(user: User | null | undefined): DxProfile | null {
  const raw = user?.user_metadata?.["dx_profile"] as Partial<DxProfile> | undefined;
  return raw && typeof raw.completedAt === "string" ? (raw as DxProfile) : null;
}

export function firstNameOf(user: User | null | undefined): string {
  const full = (user?.user_metadata?.["full_name"] as string | undefined)?.trim();
  if (full) return full.split(/\s+/)[0]!;
  return user?.email?.split("@")[0] ?? "there";
}
