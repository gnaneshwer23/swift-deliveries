import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  buildSequence,
  castForMission,
  type BuildBeatView,
  type FocalArtefact,
} from "@/lib/pilot-mission/build-beats";
import {
  buildPmBrief,
  STAFFING_BAND_LABELS,
  type PmBrief,
} from "@/lib/pilot-mission/pm-brief";
import {
  actState,
  honestyBadges,
  ROADMAP_BEATS,
  THEATRE_ACT_LABELS,
  THEATRE_ACTS,
  theatreState,
  type TheatreAct,
} from "@/lib/pilot-mission/theatre";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "@/lib/pilot-mission/research-mode";

export type MissionTheatreActions = {
  open: boolean;
  next: { id: string; title: string; detail: string };
  usageWarning: string | null;
  error: string | null;
  research: {
    tools: Array<{ id: string; label: string; available: boolean; detail: string }>;
    blockReason: string | null;
    externalGaps: string[];
  };
  modelConfigured: boolean;
  comparisonScope: string;
  consentedScope: string | null;
  setConsentedScope: (scope: string | null) => void;
  approvePending: boolean;
  onApprove: () => void;
  setResearchPending: boolean;
  onSetResearch: (mode: ResearchMode) => void;
  comparePending: boolean;
  onCompare: () => void;
  preparePending: boolean;
  onPrepare: () => void;
  prototypePending: boolean;
  onApprovePrototype: () => void;
  exportSlot: ReactNode;
};

/**
 * Five-act briefing theatre on the supervised mission URL.
 * Honesty stays as badges; gates and decision pack remain.
 */
export function MissionTheatre({
  mission,
  actions,
}: {
  mission: SupervisedMission;
  actions: MissionTheatreActions;
}) {
  const theatre = theatreState(mission);
  const [viewAct, setViewAct] = useState<TheatreAct | null>(null);
  const active = viewAct ?? theatre.current;
  const brief = buildPmBrief(mission);
  const badges = honestyBadges(mission);

  return (
    <div className="ps-theatre" aria-label="Mission briefing theatre">
      <ol className="ps-theatre-acts" aria-label="Investigation acts">
        {THEATRE_ACTS.map((act) => {
          const state = actState(theatre, act);
          const viewing = active === act;
          return (
            <li key={act} data-state={state} data-viewing={viewing ? "true" : undefined}>
              <button
                type="button"
                className="ps-theatre-act-btn"
                aria-current={viewing ? "step" : undefined}
                onClick={() => setViewAct(act)}
              >
                <span className="ps-theatre-act-label">{THEATRE_ACT_LABELS[act]}</span>
                {state === "current" && !viewAct ? (
                  <span className="ps-theatre-act-now">Now</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="ps-theatre-stage" data-act={active}>
        {active === "briefing" ? <ActBriefing brief={brief} badges={badges} /> : null}
        {active === "roadmap" ? <ActRoadmap brief={brief} /> : null}
        {active === "cast" ? <ActCast mission={mission} brief={brief} /> : null}
        {active === "approve" ? (
          <ActApprove
            mission={mission}
            brief={brief}
            badges={badges}
            actions={actions}
          />
        ) : null}
        {active === "work" ? (
          <ActWork mission={mission} brief={brief} badges={badges} actions={actions} />
        ) : null}
      </div>

      {theatre.planApproved && active !== "work" ? (
        <p className="cc-muted text-sm mt-3">
          <button
            type="button"
            className="cc-btn cc-btn-ghost"
            onClick={() => setViewAct("work")}
          >
            Return to build stage →
          </button>
        </p>
      ) : null}

      {!theatre.planApproved && active !== "approve" && actions.next.id === "approve_plan" ? (
        <p className="cc-muted text-sm mt-3">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setViewAct("approve")}
          >
            Continue to approve plan →
          </button>
        </p>
      ) : null}
    </div>
  );
}

function HonestyBadgeRow({ badges }: { badges: Array<{ id: string; label: string }> }) {
  return (
    <ul className="ps-honesty-badges" aria-label="How this was produced">
      {badges.map((b) => (
        <li key={b.id}>{b.label}</li>
      ))}
    </ul>
  );
}

function ActBriefing({
  brief,
  badges,
}: {
  brief: PmBrief;
  badges: Array<{ id: string; label: string }>;
}) {
  return (
    <section className="ps-act ps-act-briefing" aria-label="Technology briefing">
      <p className="cc-kicker">{brief.team.initiatingAgent}</p>
      <h2 className="ps-theatre-title">Here’s what I heard</h2>
      <p className="ps-theatre-lede">{brief.problemStatement}</p>
      <HonestyBadgeRow badges={badges} />
      <div className="ps-theatre-columns">
        <div>
          <h3>Known</h3>
          <ul>
            {brief.knowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Unknown</h3>
          <ul>
            {brief.unknowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="cc-muted text-sm mt-3">
        Ask you only when: {brief.askFounderOnlyWhen}
      </p>
      <details className="ps-theatre-footnote">
        <summary>How this was produced</summary>
        <p className="cc-muted text-sm">{brief.honesty}</p>
      </details>
    </section>
  );
}

function ActRoadmap({ brief }: { brief: PmBrief }) {
  return (
    <section className="ps-act ps-act-roadmap" aria-label="Strategy and roadmap">
      <p className="cc-kicker">Strategy</p>
      <h2 className="ps-theatre-title">Proposed approach</h2>
      <p className="cc-muted">
        {brief.roughTime.label}
        <span className="block text-sm">{brief.roughTime.detail}</span>
      </p>
      <ol className="ps-roadmap-beats">
        {ROADMAP_BEATS.map((beat, index) => (
          <li key={beat.id}>
            <strong>
              {index + 1}. {beat.label}
            </strong>
            <span>{beat.detail}</span>
            {brief.whatWillHappen[index] ? (
              <span className="cc-muted text-sm block">{brief.whatWillHappen[index]}</span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="cc-muted text-sm mt-3">
        Cost band: {brief.roughCost.band}. {brief.roughCost.detail}
      </p>
    </section>
  );
}

function ActCast({
  mission,
  brief,
}: {
  mission: SupervisedMission;
  brief: PmBrief;
}) {
  const staffing = brief.team.staffing;
  const cast = castForMission(mission);
  const sequence = buildSequence(mission);
  const currentBeat = sequence.beats.find((b) => b.id === sequence.currentId);

  return (
    <section className="ps-act ps-act-cast" aria-label="Cast and timeline">
      <p className="cc-kicker">Delivery cast</p>
      <h2 className="ps-theatre-title">Who delivers what</h2>
      <p className="cc-muted">
        {brief.team.initiatingAgent} initiating · {staffing.activeSpecialists} on this plan
        {currentBeat
          ? ` · now: ${currentBeat.label} (${currentBeat.owner.label})`
          : sequence.planApproved
            ? " · build sequence complete through Pack"
            : ""}
      </p>
      <ul className="ps-cast-board">
        {cast.map((s) => (
          <li
            key={s.id}
            data-status={s.status}
            data-actor={s.actor}
            data-current-owner={s.isCurrentOwner ? "true" : undefined}
          >
            <strong>
              {s.label}
              {s.isCurrentOwner ? " · owns beat" : ""}
            </strong>
            <span>{s.contribution}</span>
            <span className="cc-muted text-xs">Handoff: {s.handoff}</span>
          </li>
        ))}
      </ul>
      <p className="cc-muted text-sm mt-3">
        {STAFFING_BAND_LABELS[staffing.band]} · catalogue intent {staffing.catalogueTargetMin}–
        {staffing.catalogueTargetMax} (label only — not all 150).
      </p>
      <Link to="/command/capabilities" className="cc-btn cc-btn-secondary mt-3 inline-flex">
        Open cast on Specialists →
      </Link>
    </section>
  );
}

function ActApprove({
  mission,
  brief,
  badges,
  actions,
}: {
  mission: SupervisedMission;
  brief: PmBrief;
  badges: Array<{ id: string; label: string }>;
  actions: MissionTheatreActions;
}) {
  const approved = Boolean(mission.team?.approvedAt);
  return (
    <section className="ps-act ps-act-approve" aria-label="Approve plan" id="mission-next-action">
      <p className="cc-kicker">Your gate</p>
      <h2 className="ps-theatre-title">
        {approved ? "Plan approved" : "Approve this investigation plan"}
      </h2>
      <p className="ps-theatre-lede">{brief.problemStatement}</p>
      <HonestyBadgeRow badges={badges} />
      <ul className="ps-approve-summary">
        <li>
          <strong>Cast</strong> {brief.team.activeLabels.slice(0, 6).join(" · ") || "Proposed team"}
        </li>
        <li>
          <strong>Time</strong> {brief.roughTime.label}
        </li>
        <li>
          <strong>Cost</strong> {brief.roughCost.band}
        </li>
        <li>
          <strong>Research</strong> {brief.research.stance}
        </li>
      </ul>
      {actions.error ? <p className="cc-error mt-2">{actions.error}</p> : null}
      {actions.usageWarning ? <p className="cc-error mt-2">{actions.usageWarning}</p> : null}
      {!approved && actions.next.id === "approve_plan" ? (
        <button
          type="button"
          className="cc-btn cc-btn-primary mt-4"
          disabled={!actions.open || actions.approvePending}
          onClick={actions.onApprove}
        >
          {actions.approvePending ? "Approving…" : "Approve PM brief & specialist plan"}
        </button>
      ) : null}
      {approved ? (
        <p className="cc-muted text-sm mt-3">
          Approved {mission.team?.approvedAt ? new Date(mission.team.approvedAt).toLocaleString() : ""}.
          Build stage is open.
        </p>
      ) : (
        <p className="cc-muted text-sm mt-3">
          Nothing billable or external runs until you approve. Web results are never invented when a
          provider is missing.
        </p>
      )}
    </section>
  );
}

function ArtefactCard({ artefact }: { artefact: FocalArtefact }) {
  const verifyFailed = artefact.verification?.some((c) => !c.passed) ?? false;
  return (
    <article className="ps-focal-artefact" aria-label={`Focal artefact: ${artefact.title}`}>
      <div className="ps-focal-artefact-head">
        <h3>{artefact.title}</h3>
        <span className="ps-honesty-badges" aria-label="How this was produced">
          <span data-honesty={artefact.honesty.mode}>{artefact.honesty.label}</span>
          {artefact.verification ? (
            <span data-honesty={verifyFailed ? "gap" : "model"}>
              {verifyFailed ? "Verify failed" : "Automatically tested"}
            </span>
          ) : null}
        </span>
      </div>
      <p>{artefact.summary}</p>
      {artefact.sources && artefact.sources.length > 0 ? (
        <ul className="ps-focal-sources" aria-label="Cited sources">
          {artefact.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {artefact.verification && artefact.verification.length > 0 ? (
        <ul className="ps-proto-checks" aria-label="Static prototype checks">
          {artefact.verification.map((c) => (
            <li key={c.id} data-passed={c.passed ? "true" : "false"}>
              {c.passed ? "Pass" : "Fail"} — {c.label}
            </li>
          ))}
        </ul>
      ) : null}
      {artefact.html ? (
        <iframe
          title={artefact.title}
          className="ps-proto-frame"
          srcDoc={artefact.html}
          sandbox="allow-scripts"
        />
      ) : null}
      {artefact.gaps.length > 0 ? (
        <ul className="ps-focal-gaps">
          {artefact.gaps.map((g) => (
            <li key={g.slice(0, 48)}>{g}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function BuildBeatRail({
  beats,
  selectedId,
  onSelect,
}: {
  beats: BuildBeatView[];
  selectedId: string | null;
  onSelect: (id: BuildBeatView["id"]) => void;
}) {
  return (
    <ol className="ps-build-beats" aria-label="Product build sequence">
      {beats.map((beat) => (
        <li key={beat.id} data-state={beat.state} data-selected={selectedId === beat.id ? "true" : undefined}>
          <button
            type="button"
            className="ps-build-beat-btn"
            aria-current={selectedId === beat.id ? "step" : undefined}
            onClick={() => onSelect(beat.id)}
          >
            <strong>{beat.label}</strong>
            <span className="cc-muted text-xs">{beat.owner.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function ActWork({
  mission,
  brief,
  badges,
  actions,
}: {
  mission: SupervisedMission;
  brief: PmBrief;
  badges: Array<{ id: string; label: string }>;
  actions: MissionTheatreActions;
}) {
  const sequence = buildSequence(mission);
  const [viewBeatId, setViewBeatId] = useState<BuildBeatView["id"] | null>(null);
  const selectedId = viewBeatId ?? sequence.currentId ?? sequence.beats[0]?.id ?? null;
  const selected = sequence.beats.find((b) => b.id === selectedId) ?? null;
  const focal = selected?.artefact ?? sequence.beats.find((b) => b.id === sequence.currentId)?.artefact;

  return (
    <section className="ps-act ps-act-work" aria-label="Product build stage">
      <div className="ps-act-work-head">
        <div>
          <p className="cc-kicker">Product build</p>
          <h2 className="ps-theatre-title">
            {selected ? `${selected.label} · ${selected.owner.label}` : actions.next.title}
          </h2>
          <p className="cc-muted">
            {selected?.handoff.detail ?? actions.next.detail}
          </p>
        </div>
        <HonestyBadgeRow badges={badges} />
      </div>

      {sequence.planApproved ? (
        <>
          <BuildBeatRail
            beats={sequence.beats}
            selectedId={selectedId}
            onSelect={(id) => setViewBeatId(id)}
          />
          {focal ? (
            <ArtefactCard artefact={focal} />
          ) : selected ? (
            <p className="cc-muted text-sm mt-3">
              {selected.state === "upcoming" || selected.handoff.status === "waiting_upstream"
                ? selected.handoff.detail
                : `${selected.owner.label} will produce the next artefact when this beat is ready.`}
            </p>
          ) : null}
          {selected ? (
            <p className="cc-muted text-xs mt-2">
              Contribution: {selected.contribution} · Handoff: {selected.handoff.status.replaceAll("_", " ")}
            </p>
          ) : null}
        </>
      ) : (
        <p className="cc-muted">Approve the plan to open the product-build sequence.</p>
      )}

      <div className="ps-work-actions" id="mission-next-action">
        {actions.error ? <p className="cc-error">{actions.error}</p> : null}
        {actions.usageWarning ? <p className="cc-error">{actions.usageWarning}</p> : null}
        <p className="cc-muted text-sm mb-2">{actions.next.detail}</p>

        <details className="ps-theatre-footnote">
          <summary>Research mode & tools</summary>
          {(() => {
            const webTool = actions.research.tools.find((t) => t.id === "web_search");
            const webReady = Boolean(webTool?.available);
            return (
              <p
                className="ps-research-readiness-chip mt-2"
                data-ready={webReady}
                role="status"
              >
                {webReady
                  ? webTool?.label ?? "Web research ready"
                  : "Web research not configured"}
                {mission.researchProvider
                  ? ` · last pass cited via ${mission.researchProvider}`
                  : ""}
              </p>
            );
          })()}
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(RESEARCH_MODE_LABELS) as ResearchMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`cc-btn ${mission.researchMode === mode ? "cc-btn-primary" : "cc-btn-secondary"}`}
                disabled={!actions.open || actions.setResearchPending || Boolean(mission.proposal)}
                onClick={() => actions.onSetResearch(mode)}
              >
                {RESEARCH_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
          <ul className="ps-research-tools">
            {actions.research.tools.map((tool) => (
              <li key={tool.id} data-available={tool.available}>
                <strong>{tool.label}</strong>
                {!tool.available ? " — unavailable" : ""}
                <span className="cc-muted block text-sm">{tool.detail}</span>
              </li>
            ))}
          </ul>
          {actions.research.blockReason ? (
            <p className="cc-error mt-2" role="alert">
              {actions.research.blockReason}
            </p>
          ) : null}
        </details>

        {(actions.next.id === "compare" ||
          actions.next.id === "retry" ||
          actions.next.id === "recover") &&
        actions.modelConfigured ? (
          <label className="cc-muted mt-3 block">
            <input
              type="checkbox"
              checked={actions.consentedScope === actions.comparisonScope}
              onChange={(e) =>
                actions.setConsentedScope(e.target.checked ? actions.comparisonScope : null)
              }
            />{" "}
            Allow this comparison to send the current brief and evidence to the configured provider
            and reserve one comparison unit.
          </label>
        ) : null}
        {actions.next.id === "compare" ||
        actions.next.id === "retry" ||
        actions.next.id === "recover" ? (
          <button
            type="button"
            className="cc-btn cc-btn-primary mt-3"
            disabled={
              actions.comparePending ||
              (actions.modelConfigured && actions.consentedScope !== actions.comparisonScope) ||
              (actions.next.id === "recover" &&
                Date.parse(mission.job.leaseUntil ?? "") > Date.now())
            }
            onClick={actions.onCompare}
          >
            {actions.comparePending
              ? "Comparing…"
              : actions.next.id === "retry"
                ? "Retry comparison"
                : "Compare options"}
          </button>
        ) : null}
        {actions.next.id === "artefact" ? (
          <button
            type="button"
            className="cc-btn cc-btn-primary mt-3"
            disabled={actions.preparePending}
            onClick={actions.onPrepare}
          >
            {actions.preparePending ? "Preparing…" : "Prepare decision pack"}
          </button>
        ) : null}
        {actions.next.id === "approve_prototype" ? (
          <button
            type="button"
            className="cc-btn cc-btn-primary mt-3"
            disabled={actions.prototypePending}
            onClick={actions.onApprovePrototype}
          >
            {actions.prototypePending
              ? "Building prototype…"
              : "Approve sandboxed HTML prototype"}
          </button>
        ) : null}
        {actions.next.id === "export" || mission.exportBody ? actions.exportSlot : null}
        <p className="cc-muted text-xs mt-3">
          Time band: {brief.roughTime.label}. Usage {mission.usageConsumed}/{mission.usageCeiling}.
        </p>
      </div>
    </section>
  );
}
