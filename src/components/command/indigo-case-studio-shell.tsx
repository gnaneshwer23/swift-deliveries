import type { ReactNode } from "react";
import { IndigoCaseTabs, type IndigoCaseTabId } from "@/components/command/indigo-case-tabs";
import { IndigoCaseRail } from "@/components/command/indigo-case-rail";
import { ProjectBriefingBanner } from "@/components/command/project-briefing-banner";
import { CommunicationKitPanel } from "@/components/command/communication-kit-panel";
import { DecisionsEvidenceCenter } from "@/components/command/decisions-evidence-center";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { nextRequiredAction } from "@/lib/pilot-mission/types";

function tabFromHash(hash: string): IndigoCaseTabId {
  const id = hash.replace(/^#/, "") as IndigoCaseTabId;
  const known = [
    "indigo-briefing",
    "indigo-evidence",
    "indigo-communication",
    "indigo-team",
    "indigo-decisions",
    "indigo-roadmap",
    "indigo-outcomes",
    "indigo-downloads",
  ];
  return known.includes(id) ? id : "indigo-briefing";
}

export function IndigoCaseStudioShell({
  mission,
  missionId,
  recordHash,
  theatre,
  downloadsSlot,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordHash: string;
  theatre: ReactNode;
  downloadsSlot: ReactNode | null;
}) {
  const activeTab = tabFromHash(recordHash);
  const next = nextRequiredAction(mission);

  return (
    <div className="ps-indigo-case-studio">
      <header className="ps-indigo-case-header">
        <p className="ps-exec-section-kicker">Project case</p>
        <h1 className="ps-indigo-case-title">{mission.brief.question}</h1>
        <p className="ps-exec-meta">
          Stage {mission.stage} · Next gate: {next.title}
        </p>
        <IndigoCaseTabs missionId={missionId} activeId={activeTab} />
      </header>

      <div className="ps-indigo-case-layout">
        <div className="ps-indigo-case-main">
          <section
            id="indigo-briefing"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-briefing"}
            aria-label="Briefing and vision"
          >
            <ProjectBriefingBanner mission={mission} />
            <div className="ps-indigo-theatre mt-4">{theatre}</div>
          </section>

          <section
            id="indigo-evidence"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-evidence"}
            aria-label="Evidence and research"
          >
            <p className="cc-muted text-sm">
              Full evidence editor and research outputs live under{" "}
              <a href="#mission-evidence">Inspect → evidence</a>. Summary from the register:
            </p>
            {mission.evidence.length === 0 ? (
              <p className="cc-muted text-sm">No evidence rows stored yet.</p>
            ) : (
              <ul className="ps-exec-card ps-indigo-list text-sm grid gap-2">
                {mission.evidence.map((e) => (
                  <li key={e.id}>
                    <strong>
                      {e.id} · {e.classification}
                    </strong>
                    <p className="cc-muted mb-0">{e.statement}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="indigo-communication"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-communication"}
          >
            <CommunicationKitPanel mission={mission} />
          </section>

          <section
            id="indigo-team"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-team"}
          >
            <p className="cc-muted text-sm">
              Team assignments and handoffs are persisted — open{" "}
              <a href="#mission-team-activity">team activity</a> for the full trace.
            </p>
            {(mission.activity?.length ?? 0) > 0 ? (
              <ol className="ps-exec-card text-sm cc-muted grid gap-1">
                {[...(mission.activity ?? [])]
                  .slice(-10)
                  .reverse()
                  .map((event) => (
                    <li key={`${event.at}-${event.kind}`}>
                      {event.actor} · {event.kind}: {event.summary}
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="cc-muted text-sm">No team activity events on the record yet.</p>
            )}
          </section>

          <section
            id="indigo-decisions"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-decisions"}
          >
            <DecisionsEvidenceCenter mission={mission} />
          </section>

          <section
            id="indigo-roadmap"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-roadmap"}
          >
            {mission.continuationPlan ? (
              <div className="ps-exec-card">
                <p className="ps-exec-section-kicker">Continuation roadmap</p>
                <p className="text-sm">{mission.continuationPlan.summary}</p>
                <a href="#continuation-plan" className="cc-muted text-xs">
                  Full plan in Inspect record ↓
                </a>
              </div>
            ) : (
              <p className="cc-muted text-sm">
                Roadmap appears after you authorise a path and a continuation plan is stored.
              </p>
            )}
          </section>

          <section
            id="indigo-outcomes"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-outcomes"}
          >
            <p className="cc-muted text-sm">
              Outcome expectation, observation, and review forms are under{" "}
              <a href="#pr-outcomes">Inspect → outcome review</a>.
            </p>
            {!mission.approval && !mission.origin ? (
              <p className="cc-muted text-sm">No decision to learn from yet.</p>
            ) : null}
          </section>

          <section
            id="indigo-downloads"
            className="ps-indigo-tab-panel"
            hidden={activeTab !== "indigo-downloads"}
          >
            {downloadsSlot ?? (
              <p className="cc-muted text-sm">
                No export on record yet. Prepare the decision pack when the workflow reaches export.
              </p>
            )}
          </section>
        </div>
        <IndigoCaseRail mission={mission} />
      </div>
    </div>
  );
}
