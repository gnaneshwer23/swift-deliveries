import { pathArtefactGuide } from "@/lib/pilot-mission/path-artefacts";
import { normalizeDecisionChoice } from "@/lib/pilot-mission/verdict";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** R4 — artefacts expected for the authorised path; never implies automatic build. */
export function PathArtefactsPanel({ mission }: { mission: SupervisedMission }) {
  if (!mission.approval) return null;
  const guide = pathArtefactGuide(normalizeDecisionChoice(mission.approval.choice));

  return (
    <section className="cc-panel" aria-label="Path artefacts">
      <h2 className="cc-panel-title">Artefacts for this path</h2>
      <p className="cc-muted text-sm">
        {guide.pathLabel}. {guide.notAutomatic}
      </p>
      <ul className="mt-3 grid gap-2 text-sm">
        {guide.expectedArtefacts.map((item) => (
          <li key={item.type}>
            <strong>{item.type}</strong>
            <p className="cc-muted mb-0">{item.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
