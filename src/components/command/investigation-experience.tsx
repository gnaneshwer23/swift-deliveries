import { IntelligenceCanvasPanel } from "@/components/command/intelligence-canvas-panel";
import { ProductIntelligenceMap } from "@/components/command/product-intelligence-map";
import { buildInvestigationExperience } from "@/lib/pilot-mission/investigation-experience";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** Investigation workspace — Screen 5 Product Intelligence Map (event-backed). */
export function InvestigationExperience({
  mission,
  missionId,
  recordVersion,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordVersion: number;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const experience = buildInvestigationExperience(mission);

  return (
    <section
      className="ps-investigation-experience"
      aria-label="Investigation"
      data-state={experience.state}
      data-converging={experience.converging ? "true" : undefined}
    >
      <ProductIntelligenceMap mission={mission} />

      <details className="ps-investigation-map-inspect">
        <summary>Map controls &amp; inspect</summary>
        <IntelligenceCanvasPanel
          mission={mission}
          missionId={missionId}
          recordVersion={recordVersion}
          onDone={onDone}
          onError={onError}
        />
      </details>
    </section>
  );
}
