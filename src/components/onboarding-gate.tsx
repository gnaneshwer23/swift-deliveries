import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { myProfileQuery } from "@/lib/profile-queries";

/**
 * Sends a signed-in person who has not finished setup to onboarding.
 * Reads only their own profile; never writes.
 */
export function OnboardingGate() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const profile = useQuery({ ...myProfileQuery, enabled: !loading && !!user });

  useEffect(() => {
    if (profile.isSuccess && !profile.data) void navigate({ to: "/onboarding", replace: true });
  }, [profile.isSuccess, profile.data, navigate]);

  return null;
}
