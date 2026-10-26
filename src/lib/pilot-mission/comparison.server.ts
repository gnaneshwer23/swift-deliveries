import { neonTransaction, type DbTransaction } from "@/lib/db/neon.server";
import { reservedComparison } from "./reservations.server";
import type { SupervisedMissionService } from "./service";

/** The reservation owns both counters; completion only persists the mission result. */
export function runAccountedComparison(
  service: SupervisedMissionService,
  input: Parameters<SupervisedMissionService["runAlternatives"]>[0],
  transact: DbTransaction = neonTransaction,
) {
  return service.runAlternatives({
    ...input,
    generator: {
      cost: input.generator.cost,
      run: (mission) =>
        input.generator.cost > 0
          ? reservedComparison(mission, () => input.generator.run(mission), transact)
          : input.generator.run(mission),
    },
  });
}
