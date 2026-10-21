import { queryOptions } from "@tanstack/react-query";
import { getTeam, getWorkspaceBootstrap } from "./workspace.functions";

export const workspaceBootstrapQuery = queryOptions({
  queryKey: ["workspace", "bootstrap"],
  queryFn: () => getWorkspaceBootstrap(),
});

export const teamQuery = (organisationId: string) =>
  queryOptions({
    queryKey: ["workspace", "team", organisationId],
    queryFn: () => getTeam({ data: { organisationId } }),
  });
