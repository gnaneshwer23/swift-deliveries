import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { dxProfileOf } from "@/lib/dx-profile";

/**
 * Sends a signed-in person who has not finished setup to onboarding.
 * Reads only their own auth profile; never writes.
 */
export function OnboardingGate() {
  const navigate = useNavigate();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading || !user) return;
    if (!dxProfileOf(user)) void navigate({ to: "/onboarding", replace: true });
  }, [user, loading, navigate]);

  return null;
}
