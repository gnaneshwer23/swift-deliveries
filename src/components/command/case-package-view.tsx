import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supervisedZipInventory } from "@/lib/pilot-mission/supervised-zip";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { missionBundleQuery } from "@/lib/workforce-queries";
import { artefactProduction } from "@/lib/workforce/stage-artefacts";
import { QUALITY_LABEL_DISPLAY } from "@/lib/workforce/types";

/**
 * Screen 13 — what the case can hand over: the case archive (exactly the files its manifest
 * lists) and the delivery mission's artefacts with how each was produced.
 */
export function CasePackageView({
  mission,
  downloadsSlot,
}: {
  mission: SupervisedMission;
  downloadsSlot: ReactNode | null;
}) {
  // Same assembly as the download, without building file bodies, so the list cannot drift.
  const inventory = useMemo(() => supervisedZipInventory(mission), [mission]);
  return (
    <div className="sx-doc">
      <section aria-labelledby="sx-package-case">
        <div className="sx-row">
          <h3 id="sx-package-case">Case archive</h3>
        </div>
        <p className="sx-detail">
          The decision record, briefing, evidence register and prototype. Linked sources are
          referenced, not bundled.
        </p>
        {downloadsSlot ?? (
          <p className="sx-empty">Downloads open once the decision pack is prepared or exported.</p>
        )}
        <ul className="sx-list">
          {inventory.map((item) => (
            <li key={item.path}>
              <div className="sx-row">
                <span className="sx-mono">{item.path}</span>
                <span className="sx-status" data-state={item.bundled ? "done" : "upcoming"}>
                  {item.bundled ? "Included" : "Not produced yet"}
                </span>
              </div>
              <p className="sx-detail">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <DeliveryArtefacts mission={mission} />
      <p className="sx-detail">
        Earlier cases and their packages are in <Link to="/command/portfolio">your portfolio</Link>.
      </p>
    </div>
  );
}

function DeliveryArtefacts({ mission }: { mission: SupervisedMission }) {
  const delivery = mission.delivery;
  const bundle = useQuery({
    ...missionBundleQuery(delivery?.wfMissionId ?? "none"),
    enabled: Boolean(delivery),
  });
  if (!delivery) {
    return (
      <section aria-labelledby="sx-package-delivery">
        <h3 id="sx-package-delivery">Delivery outputs</h3>
        <p className="sx-empty">
          Product requirements, design, architecture, prototype and release pack appear here as the
          delivery mission produces them.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="sx-package-delivery">
      <div className="sx-row">
        <h3 id="sx-package-delivery">Delivery outputs</h3>
        <Link
          to="/command/missions/$missionId"
          params={{ missionId: delivery.wfMissionId }}
          className="sx-btn"
        >
          Review and download in the delivery mission
        </Link>
      </div>
      {bundle.isPending ? (
        <p className="sx-empty" role="status">
          Loading delivery outputs…
        </p>
      ) : bundle.isError ? (
        <p className="sx-empty" role="alert">
          Delivery outputs could not be loaded. The delivery mission page still lists them.
        </p>
      ) : bundle.data.artefacts.length ? (
        <ul className="sx-list">
          {bundle.data.artefacts.map((a) => (
            <li key={a.id}>
              <div className="sx-row">
                <strong>{a.title}</strong>
                <span className="sx-label">
                  {artefactProduction(a)?.label ?? "Production not recorded"}
                </span>
              </div>
              <p className="sx-detail">
                {a.qualityLabels.length
                  ? a.qualityLabels.map((q) => QUALITY_LABEL_DISPLAY[q]).join(" · ")
                  : "No quality checks recorded yet"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sx-empty">No delivery outputs are saved yet.</p>
      )}
    </section>
  );
}
