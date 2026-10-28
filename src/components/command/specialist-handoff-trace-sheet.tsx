import { useMemo, useState } from "react";
import { ArrowRight, Terminal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildMissionInspection } from "@/lib/pilot-mission/mission-inspection";
import {
  ensureTeamCollaboration,
  type TeamHandoff,
} from "@/lib/pilot-mission/team-collaboration";
import { AGENT_RECOMMENDATION_LABELS } from "@/lib/pilot-mission/verdict";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type HandoffTab = "trace" | "sources" | "artifacts" | "governance";

function productionDisplay(label: TeamHandoff["productionLabel"]): string {
  switch (label) {
    case "simulated draft":
      return "Simulated draft";
    case "model":
      return "Agent-reviewed (model)";
    case "human":
      return "Human-reviewed";
    case "persisted event":
      return "Persisted event";
    default:
      return label;
  }
}

function assignmentLabel(mission: SupervisedMission, taskKey: string): string {
  const record = ensureTeamCollaboration(mission);
  const a = record?.assignments.find((x) => x.taskKey === taskKey);
  return a ? `${a.ownerLabel}${a.capabilityId ? ` · ${a.capabilityId}` : ""}` : taskKey.replace(/_/g, " ");
}

export function SpecialistHandoffTraceSheet({
  mission,
  handoff,
  open,
  onOpenChange,
}: {
  mission: SupervisedMission;
  handoff: TeamHandoff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inspection = buildMissionInspection(mission);
  const record = ensureTeamCollaboration(mission);
  const [tab, setTab] = useState<HandoffTab>("trace");
  const [copied, setCopied] = useState(false);

  const evidenceForHandoff = useMemo(() => {
    if (!handoff) return [];
    const ids = new Set(handoff.evidenceIds);
    return mission.evidence.filter((e) => ids.has(e.id));
  }, [handoff, mission.evidence]);

  const hasGovernance =
    Boolean(mission.approval) ||
    Boolean(record?.recommendation) ||
    Boolean(mission.observation);

  const tabs: { id: HandoffTab; label: string; show: boolean }[] = [
    { id: "trace", label: "Trace & prompt", show: true },
    {
      id: "sources",
      label: evidenceForHandoff.length ? `Sources (${evidenceForHandoff.length})` : "Sources",
      show: true,
    },
    {
      id: "artifacts",
      label: "Artifacts",
      show: inspection.outputs.length > 0,
    },
    { id: "governance", label: "Governance", show: hasGovernance },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  async function copyTraceJson() {
    if (!handoff) return;
    const payload = {
      handoffId: handoff.id,
      missionId: mission.id,
      from: { taskKey: handoff.fromTaskKey, actor: handoff.fromActor },
      to: { taskKey: handoff.toTaskKey, actor: handoff.toActor },
      findingSummary: handoff.findingSummary,
      request: handoff.request,
      productionLabel: handoff.productionLabel,
      evidenceIds: handoff.evidenceIds,
      sharedAt: handoff.sharedAt,
      consumedAt: handoff.consumedAt,
      persistedTeamCollaboration: Boolean(mission.teamCollaboration),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!handoff) return null;

  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : visibleTabs[0]?.id ?? "trace";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="ps-exec-handoff-sheet max-h-[min(92dvh,880px)] overflow-y-auto">
        <div className="ps-exec-handoff-handle" aria-hidden="true" />
        <SheetHeader className="ps-exec-handoff-header text-left space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ps-exec-handoff-trace-id">HANDOFF {handoff.id}</span>
                <span className="ps-exec-chip" data-tone="review">
                  {productionDisplay(handoff.productionLabel)}
                </span>
              </div>
              <SheetTitle className="ps-exec-handoff-title">Specialist handoff &amp; trace</SheetTitle>
              <SheetDescription className="sr-only">
                Persisted handoff from {handoff.fromTaskKey} to {handoff.toTaskKey}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="ps-exec-handoff-icon-btn"
                aria-label="Copy handoff JSON"
                onClick={() => void copyTraceJson()}
              >
                <Terminal size={18} />
              </button>
              <button
                type="button"
                className="ps-exec-handoff-icon-btn"
                aria-label="Close inspector"
                onClick={() => onOpenChange(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {copied ? (
            <p className="ps-exec-meta mb-0" role="status">
              Copied handoff JSON
            </p>
          ) : null}
        </SheetHeader>

        <div className="ps-exec-handoff-pipeline">
          <div className="ps-exec-handoff-agent">
            <div className="ps-exec-handoff-avatar" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{assignmentLabel(mission, handoff.fromTaskKey)}</p>
              <p className="ps-exec-meta truncate">{handoff.fromActor}</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
          <div className="ps-exec-handoff-agent">
            <div className="ps-exec-handoff-avatar ps-exec-handoff-avatar-target" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{assignmentLabel(mission, handoff.toTaskKey)}</p>
              <p className="ps-exec-meta truncate">{handoff.toActor}</p>
            </div>
          </div>
        </div>
        <p className="ps-exec-meta px-1">
          Shared {new Date(handoff.sharedAt).toLocaleString()}
          {handoff.consumedAt ? ` · consumed ${new Date(handoff.consumedAt).toLocaleString()}` : ""}
          {!mission.teamCollaboration ? " · derived from approved plan (not yet persisted)" : ""}
        </p>

        <div className="ps-exec-segment-tabs" role="tablist" aria-label="Handoff inspector">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={activeTab === t.id ? "is-active" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "trace" ? (
          <div className="ps-exec-handoff-pane" role="tabpanel">
            <div className="ps-exec-handoff-block">
              <p className="ps-exec-section-kicker">Case question</p>
              <p className="text-sm leading-relaxed">{mission.brief.question}</p>
            </div>
            <div className="ps-exec-handoff-block">
              <p className="ps-exec-section-kicker">Handoff request</p>
              <p className="text-sm leading-relaxed">{handoff.request}</p>
            </div>
            <div className="ps-exec-handoff-block">
              <p className="ps-exec-section-kicker">Finding summary</p>
              <p className="text-sm leading-relaxed">{handoff.findingSummary}</p>
              {handoff.actualResult ? (
                <p className="cc-muted text-sm mt-2 mb-0">Downstream result: {handoff.actualResult}</p>
              ) : null}
              {handoff.uncertainty ? (
                <p className="cc-muted text-sm mt-2 mb-0">Open uncertainty: {handoff.uncertainty}</p>
              ) : null}
            </div>
            {record?.recommendation?.modelId && handoff.productionLabel === "model" ? (
              <div className="ps-exec-handoff-block">
                <p className="ps-exec-section-kicker">Model on record</p>
                <p className="ps-exec-meta mb-0">{record.recommendation.modelId}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "sources" ? (
          <div className="ps-exec-handoff-pane" role="tabpanel">
            {evidenceForHandoff.length === 0 ? (
              <p className="cc-muted text-sm">No evidence ids are linked to this handoff on the record.</p>
            ) : (
              <ul className="ps-exec-handoff-source-list">
                {evidenceForHandoff.map((e) => (
                  <li key={e.id} className="ps-exec-handoff-block">
                    <p className="ps-exec-meta">
                      {e.id} · {e.classification}
                    </p>
                    <p className="text-sm mb-0">{e.statement}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === "artifacts" ? (
          <div className="ps-exec-handoff-pane" role="tabpanel">
            {inspection.outputs.length === 0 ? (
              <p className="cc-muted text-sm">No mission artefacts on record yet.</p>
            ) : (
              <ul className="grid gap-2">
                {inspection.outputs.map((o) => (
                  <li key={o.id} className="ps-exec-handoff-block">
                    <strong className="text-sm">{o.label}</strong>
                    {o.productionLabel ? (
                      <span className="ps-exec-meta"> · {o.productionLabel}</span>
                    ) : null}
                    {o.detail ? <p className="cc-muted text-sm mt-1 mb-0">{o.detail}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === "governance" ? (
          <div className="ps-exec-handoff-pane" role="tabpanel">
            {mission.approval ? (
              <div className="ps-exec-handoff-block">
                <p className="ps-exec-section-kicker">Decision on record</p>
                <p className="text-sm mb-0">
                  {mission.approval.choice} · recorded{" "}
                  {new Date(mission.approval.decidedAt).toLocaleString()}
                </p>
              </div>
            ) : null}
            {record?.recommendation ? (
              <div className="ps-exec-handoff-block">
                <p className="ps-exec-section-kicker">Agent recommendation</p>
                <p className="text-sm">
                  {AGENT_RECOMMENDATION_LABELS[record.recommendation.recommendation]}
                </p>
                <p className="cc-muted text-sm mb-0">{record.recommendation.rationale}</p>
                <p className="ps-exec-meta mt-2 mb-0">
                  Production: {record.recommendation.productionLabel}
                </p>
              </div>
            ) : null}
            {mission.observation ? (
              <div className="ps-exec-handoff-block">
                <p className="ps-exec-section-kicker">Outcome observation</p>
                <p className="text-sm mb-0">{mission.observation.result}</p>
              </div>
            ) : null}
            <p className="cc-muted text-xs mt-2 mb-0">
              No cryptographic seal, Merkle attestation, or latency telemetry is stored for this
              handoff. External attestation appears only when you add it to the export manifest.
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
