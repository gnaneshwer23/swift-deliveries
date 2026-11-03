/**
 * Clicks from the Chief of Staff panel. Chat never calls these itself.
 */
import { downloadZip } from "@/lib/download-file";
import type { CosAction } from "@/lib/pilot-mission/chief-of-staff";
import {
  cancelSupervisedMission,
  exportSupervisedFullArchive,
  exportSupervisedOfficePackage,
  saveSupervisedStudioMeta,
} from "@/lib/pilot-mission.functions";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { pauseMission, resumeMission } from "@/lib/workforce.functions";

export async function performChiefOfStaffAction(input: {
  mission: SupervisedMission;
  deliveryMissionId: string | null;
  action: CosAction;
}): Promise<void> {
  const version = input.mission.version;
  const id = input.mission.id;
  switch (input.action.kind) {
    case "cancel_case":
      await cancelSupervisedMission({ data: { id, expectedVersion: version } });
      return;
    case "pause_investigation":
      await saveSupervisedStudioMeta({
        data: { id, expectedVersion: version, investigationPaused: true },
      });
      return;
    case "resume_investigation":
      await saveSupervisedStudioMeta({
        data: { id, expectedVersion: version, investigationPaused: false },
      });
      return;
    case "pause_delivery":
      if (!input.deliveryMissionId) throw new Error("This case has no delivery build to pause.");
      await pauseMission({ data: { missionId: input.deliveryMissionId } });
      return;
    case "resume_delivery":
      if (!input.deliveryMissionId) throw new Error("This case has no delivery build to resume.");
      await resumeMission({ data: { missionId: input.deliveryMissionId } });
      return;
    case "download_package": {
      const ready = Boolean(
        input.mission.artefact || input.mission.exportBody || input.mission.delivery,
      );
      const packed = ready
        ? await exportSupervisedFullArchive({ data: { id } })
        : await exportSupervisedOfficePackage({ data: { id } });
      downloadZip(packed.files, packed.filename);
      return;
    }
    default: {
      const exhaustive: never = input.action.kind;
      throw new Error(`Unknown Chief of Staff action: ${String(exhaustive)}`);
    }
  }
}
