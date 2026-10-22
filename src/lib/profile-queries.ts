import { queryOptions } from "@tanstack/react-query";
import { getMyProfile } from "./profile.functions";

export const myProfileQuery = queryOptions({
  queryKey: ["me", "profile"],
  queryFn: () => getMyProfile(),
  staleTime: 60_000,
});
