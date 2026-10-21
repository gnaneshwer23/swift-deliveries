import { queryOptions } from "@tanstack/react-query";
import { getProfessionalWorkspace } from "./professional-workspace.functions";

export const professionalWorkspaceQuery = (projectId: string | null = null) => queryOptions({
  queryKey: ["professional-workspace", projectId],
  queryFn: () => getProfessionalWorkspace({ data: { projectId } }),
});
