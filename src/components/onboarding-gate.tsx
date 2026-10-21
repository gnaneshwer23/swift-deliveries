import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { piOnboardingQuery } from "@/lib/onboarding-queries";

/**
 * Sends a signed-in person who has not finished setup into the questionnaire.
 * Read-only: it inspects onboarding state and never writes claims, evidence,
 * scores or verification.
 */
export function OnboardingGate() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { data } = useQuery({ ...piOnboardingQuery, enabled: !loading && !!user });

  useEffect(() => {
    if (!data) return;
    if (!data.state.completed) navigate({ to: "/onboarding", replace: true });
  }, [data, navigate]);

  return null;
}
