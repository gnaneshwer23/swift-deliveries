import { queryOptions } from "@tanstack/react-query";
import { getCoachingWorkspace, getCoachReviewWorkspace } from "./coaching.functions";

export const coachingWorkspaceQuery = queryOptions({
  queryKey: ["coaching", "workspace"],
  queryFn: () => getCoachingWorkspace(),
});

export const coachReviewQuery = queryOptions({
  queryKey: ["coaching", "review"],
  queryFn: () => getCoachReviewWorkspace(),
});
