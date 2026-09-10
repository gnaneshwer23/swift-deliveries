import { queryOptions } from "@tanstack/react-query";
import { getCoachingWorkspace } from "./coaching.functions";

export const coachingWorkspaceQuery = queryOptions({
  queryKey: ["coaching", "workspace"],
  queryFn: () => getCoachingWorkspace(),
});