import { queryOptions } from "@tanstack/react-query";
import { getMonitoringOverview } from "@/lib/monitoring.functions";

export const monitoringOverviewQuery = queryOptions({
  queryKey: ["monitoring-overview"],
  queryFn: () => getMonitoringOverview(),
  staleTime: 15_000,
});
