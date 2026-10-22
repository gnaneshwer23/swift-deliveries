import { queryOptions } from "@tanstack/react-query";
import { getProgramme, getProgrammeFeatures, listProgrammes } from "./programme.functions";

export const programmeFeaturesQuery = queryOptions({
  queryKey: ["programmes", "features"],
  queryFn: () => getProgrammeFeatures(),
});

export const programmesListQuery = queryOptions({
  queryKey: ["programmes", "list"],
  queryFn: () => listProgrammes(),
});

export const programmeQuery = (id: string) =>
  queryOptions({
    queryKey: ["programmes", "detail", id],
    queryFn: () => getProgramme({ data: { id } }),
  });
