import { queryOptions } from "@tanstack/react-query";
import { getExperienceWorkspace } from "./experience.functions";

export const experienceWorkspaceQuery = queryOptions({
  queryKey: ["experience", "workspace"],
  queryFn: () => getExperienceWorkspace(),
});
