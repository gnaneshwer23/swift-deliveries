/**
 * Programme cast scales by complexity toward the catalogue ceiling.
 * Same bands as supervised missions — never pretends every simple case staffs 150.
 */
import {
  BAND_CATALOGUE_N,
  CATALOGUE_CEILING,
  selectCatalogueRosterForBand,
  type StaffingBand,
} from "@/lib/pilot-mission/specialist-team";
import { estimateStaffingBand } from "@/lib/pilot-mission/pm-brief";
import type { BusinessCase } from "./types";

export type ProgrammeStaffing = {
  band: StaffingBand;
  catalogueSelected: number;
  catalogueAvailable: number;
  cataloguePlanned: number;
  catalogueCeiling: number;
  /** Roster IDs in band (Available first, then Planned). */
  rosterIds: string[];
  reason: string;
};

/** Derive programme catalogue roster from the business-case text. */
export function programmeStaffingFor(bc: Pick<BusinessCase, "idea" | "problem" | "goals">): ProgrammeStaffing {
  const text = [bc.idea, bc.problem, bc.goals].filter(Boolean).join(" ");
  const estimate = estimateStaffingBand(text);
  const roster = selectCatalogueRosterForBand(estimate.band);
  return {
    band: estimate.band,
    catalogueSelected: roster.selected,
    catalogueAvailable: roster.availableCount,
    cataloguePlanned: roster.plannedCount,
    catalogueCeiling: CATALOGUE_CEILING,
    rosterIds: roster.ids,
    reason: estimate.reason,
  };
}

export function bandCatalogueN(band: StaffingBand): number {
  return BAND_CATALOGUE_N[band];
}

/** Legacy programmes without staffing: treat as XL (historical always-on ceiling). */
export function staffingOrLegacy(
  staffing: ProgrammeStaffing | undefined,
): Pick<
  ProgrammeStaffing,
  "band" | "catalogueSelected" | "catalogueCeiling" | "rosterIds"
> {
  if (staffing) {
    return {
      band: staffing.band,
      catalogueSelected: staffing.catalogueSelected,
      catalogueCeiling: staffing.catalogueCeiling,
      rosterIds: staffing.rosterIds,
    };
  }
  return {
    band: "XL",
    catalogueSelected: CATALOGUE_CEILING,
    catalogueCeiling: CATALOGUE_CEILING,
    rosterIds: [],
  };
}
