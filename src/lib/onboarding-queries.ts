import { queryOptions } from "@tanstack/react-query";
import { getDailyBriefing, getPiOnboarding } from "./onboarding.functions";

export const piOnboardingQuery = queryOptions({
  queryKey: ["pi", "onboarding"],
  queryFn: () => getPiOnboarding(),
});

export const dailyBriefingQuery = queryOptions({
  queryKey: ["pi", "briefing"],
  queryFn: () => getDailyBriefing(),
});
