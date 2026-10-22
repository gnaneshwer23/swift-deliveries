/**
 * DeliverX onboarding profile, stored in Neon (`dx_profiles`), owner-only.
 */
import type { AppUser } from "@/lib/auth/client";

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
  fullName: string;
  role: string;
  teamSize: string;
  goal: string;
  firstIdea: string;
  completedAt: string;
};

export function firstNameOf(user: AppUser | null | undefined, profile?: DxProfile | null): string {
  const full = (profile?.fullName || user?.user_metadata?.full_name || "").trim();
  if (full) return full.split(/\s+/)[0]!;
  return user?.email?.split("@")[0] ?? "there";
}
