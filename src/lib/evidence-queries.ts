import { queryOptions } from "@tanstack/react-query";
import { getEvidenceOverview } from "./evidence.functions";

export const evidenceOverviewQuery = queryOptions({
  queryKey: ["evidence", "overview"],
  queryFn: () => getEvidenceOverview(),
});
