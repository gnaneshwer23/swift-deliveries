import { queryOptions } from "@tanstack/react-query";
import {
  getCommandCentreBootstrap,
  getMissionBundle,
  getOwnerInbox,
  listWfProjects,
} from "./workforce.functions";

export const commandCentreBootstrapQuery = queryOptions({
  queryKey: ["command", "bootstrap"],
  queryFn: () => getCommandCentreBootstrap(),
});

export const ownerInboxQuery = queryOptions({
  queryKey: ["command", "inbox"],
  queryFn: () => getOwnerInbox(),
});

export const wfProjectsQuery = queryOptions({
  queryKey: ["command", "projects"],
  queryFn: () => listWfProjects(),
});

export const missionBundleQuery = (missionId: string) =>
  queryOptions({
    queryKey: ["command", "mission", missionId],
    queryFn: () => getMissionBundle({ data: { missionId } }),
  });
