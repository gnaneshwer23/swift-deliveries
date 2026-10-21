import { queryOptions } from "@tanstack/react-query";
import { getLaunchpadPack, getPublicPortfolio } from "./launchpad.functions";

export const launchpadPackQuery = queryOptions({
  queryKey: ["launchpad", "pack"],
  queryFn: () => getLaunchpadPack(),
});

export const publicPortfolioQuery = (token: string) =>
  queryOptions({
    queryKey: ["portfolio", token],
    queryFn: () => getPublicPortfolio({ data: { token } }),
  });
