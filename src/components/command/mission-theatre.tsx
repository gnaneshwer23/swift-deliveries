import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ListenBriefButton } from "@/components/command/listen-brief-button";
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
import { commerceSnapshot } from "@/lib/pilot-mission/commerce";
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
 * D3: one focal gate/CTA, beat rail as stage, process copy as footnotes.
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
        <p className="ps-theatre-nav">
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setViewAct("work")}>
            Return to build stage →
          </button>
        </p>
      ) : null}

      {!theatre.planApproved && active !== "approve" && actions.next.id === "approve_plan" ? (
        <p className="ps-theatre-nav">
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
      <p className="ps-foyer-brand">DeliverX Studio</p>
      <p className="cc-kicker">{brief.team.initiatingAgent}</p>
      <h2 className="ps-theatre-title">Here’s what I heard</h2>
      <p className="ps-theatre-lede">{brief.problemStatement}</p>
      <HonestyBadgeRow badges={badges} />
      <ListenBriefButton brief={brief} />
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
      <div className="ps-theatre-footnotes">
        <p>Ask you only when: {brief.askFounderOnlyWhen}</p>
        <details>
          <summary>How this was produced</summary>
          <p>{brief.honesty}</p>
        </details>
      </div>
    </section>
  );
}

function ActRoadmap({ brief }: { brief: PmBrief }) {
  return (
    <section className="ps-act ps-act-roadmap" aria-label="Strategy and roadmap">
      <p className="ps-foyer-brand">DeliverX Studio</p>
      <p className="cc-kicker">Strategy</p>
      <h2 className="ps-theatre-title">Proposed approach</h2>
      <p className="ps-theatre-lede">{brief.roughTime.label}</p>
      <ol className="ps-roadmap-beats">
        {ROADMAP_BEATS.map((beat, index) => (
          <li key={beat.id}>
            <strong>
              {index + 1}. {beat.label}
            </strong>
            <span>{beat.detail}</span>
            {brief.whatWillHappen[index] ? (
              <span className="ps-roadmap-beat-note">{brief.whatWillHappen[index]}</span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="ps-theatre-footnotes">
        <p>
          {brief.roughTime.detail} · Cost band {brief.roughCost.band}. {brief.roughCost.detail}
        </p>
      </div>
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
      <p className="ps-foyer-brand">DeliverX Studio</p>
      <p className="cc-kicker">Delivery cast</p>
      <h2 className="ps-theatre-title">Who delivers what</h2>
      <p className="ps-theatre-lede">
        {brief.team.initiatingAgent} initiating · {staffing.activeSpecialists} on this plan
        {currentBeat ? ` · now: ${currentBeat.label}` : sequence.planApproved ? " · build complete through Pack" : ""}
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
          </li>
        ))}
      </ul>
      <div className="ps-theatre-footnotes">
        <p>
          {STAFFING_BAND_LABELS[staffing.band]} · catalogue {staffing.catalogueSelected}/
          {staffing.catalogueCeiling} ({staffing.catalogueAvailable} Available ·{" "}
          {staffing.cataloguePlanned} Planned). Simple cases stay small — never fake-enables all 150.
        </p>
        <Link to="/command/capabilities" className="cc-btn cc-btn-secondary inline-flex">
          Open cast on Specialists →
        </Link>
      </div>
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
      <p className="ps-foyer-brand">DeliverX Studio</p>
      <p className="cc-kicker">Your gate · Act IV</p>
      <h2 className="ps-theatre-title">
        {approved ? "Plan approved" : "Approve this investigation plan"}
      </h2>
      <p className="ps-theatre-lede">{brief.problemStatement}</p>
      <HonestyBadgeRow badges={badges} />
      <ListenBriefButton brief={brief} />
      <ul className="ps-approve-summary">
        <li>
          <strong>Cast</strong> {brief.team.activeLabels.slice(0, 6).join(" · ") || "Proposed team"}
        </li>
        <li>
          <strong>Time</strong> {brief.roughTime.label}
        </li>
        <li>
          <strong>Research</strong> {brief.research.stance}
        </li>
      </ul>
      {actions.error ? <p className="cc-error mt-2">{actions.error}</p> : null}
      {actions.usageWarning ? <p className="cc-error mt-2">{actions.usageWarning}</p> : null}

      <div className="ps-theatre-gate">
        {!approved && actions.next.id === "approve_plan" ? (
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={!actions.open || actions.approvePending}
            onClick={actions.onApprove}
          >
            {actions.approvePending ? "Approving…" : "Approve plan"}
          </button>
        ) : null}
        {approved ? (
          <p className="ps-theatre-gate-done">
            Approved{" "}
            {mission.team?.approvedAt ? new Date(mission.team.approvedAt).toLocaleString() : ""}.
            Build stage is open.
          </p>
        ) : (
          <p className="ps-theatre-gate-note">
            Nothing billable or external runs until you approve.
          </p>
        )}
      </div>

      <div className="ps-theatre-footnotes">
        <p>
          Cost band {brief.roughCost.band}. {brief.roughCost.detail} Web results are never invented
          when a provider is missing.
        </p>
      </div>
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
    <ol className="ps-build-stage" aria-label="Product build sequence">
      {beats.map((beat, index) => (
        <li
          key={beat.id}
          data-state={beat.state}
          data-selected={selectedId === beat.id ? "true" : undefined}
        >
          <button
            type="button"
            className="ps-build-stage-btn"
            aria-current={selectedId === beat.id ? "step" : undefined}
            onClick={() => onSelect(beat.id)}
          >
            <span className="ps-build-stage-mark" aria-hidden="true">
              {index + 1}
            </span>
            <span className="ps-build-stage-label">{beat.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function FocalGate({
  actions,
  leaseUntil,
}: {
  actions: MissionTheatreActions;
  leaseUntil: string | null;
}) {
  const next = actions.next;
  const consentNeeded =
    (next.id === "compare" || next.id === "retry" || next.id === "recover") &&
    actions.modelConfigured;
  const leaseBlocksRecover =
    next.id === "recover" && Date.parse(leaseUntil ?? "") > Date.now();

  return (
    <div className="ps-theatre-gate" id="mission-next-action">
      {actions.error ? <p className="cc-error">{actions.error}</p> : null}
      {actions.usageWarning ? <p className="cc-error">{actions.usageWarning}</p> : null}

      {consentNeeded ? (
        <label className="ps-theatre-consent">
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

      {next.id === "compare" || next.id === "retry" || next.id === "recover" ? (
        <button
          type="button"
          className="cc-btn cc-btn-primary"
          disabled={
            actions.comparePending ||
            (actions.modelConfigured && actions.consentedScope !== actions.comparisonScope) ||
            leaseBlocksRecover
          }
          onClick={actions.onCompare}
        >
          {actions.comparePending
            ? "Comparing…"
            : next.id === "retry"
              ? "Retry comparison"
              : "Compare options"}
        </button>
      ) : null}

      {next.id === "artefact" ? (
        <button
          type="button"
          className="cc-btn cc-btn-primary"
          disabled={actions.preparePending}
          onClick={actions.onPrepare}
        >
          {actions.preparePending ? "Preparing…" : "Prepare decision pack"}
        </button>
      ) : null}

      {next.id === "approve_prototype" ? (
        <button
          type="button"
          className="cc-btn cc-btn-primary"
          disabled={actions.prototypePending}
          onClick={actions.onApprovePrototype}
        >
          {actions.prototypePending ? "Building prototype…" : "Approve sandboxed HTML prototype"}
        </button>
      ) : null}

      {next.id === "export" ? actions.exportSlot : null}
    </div>
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
  const current = sequence.beats.find((b) => b.id === sequence.currentId) ?? null;
  const focal =
    selected?.artefact ?? sequence.beats.find((b) => b.id === sequence.currentId)?.artefact;
  const nowBeat = selected ?? current;
  const showGate =
    !viewBeatId || viewBeatId === sequence.currentId || sequence.currentId === null;

  return (
    <section className="ps-act ps-act-work" aria-label="Product build stage">
      <div className="ps-act-now">
        <p className="ps-foyer-brand">DeliverX Studio</p>
        <p className="cc-kicker">
          {nowBeat ? `Now · ${nowBeat.label}` : "Product build"}
          {nowBeat?.owner.actor === "human" ? " · your gate" : ""}
        </p>
        <h2 className="ps-theatre-title">
          {nowBeat
            ? `${nowBeat.owner.label} · ${nowBeat.label}`
            : actions.next.title}
        </h2>
        <p className="ps-theatre-lede">
          {nowBeat?.detail ?? actions.next.detail}
        </p>
        <HonestyBadgeRow badges={badges} />
      </div>

      {sequence.planApproved ? (
        <>
          <BuildBeatRail
            beats={sequence.beats}
            selectedId={selectedId}
            onSelect={(id) => setViewBeatId(id)}
          />

          <div className="ps-act-focus">
            {focal ? (
              <ArtefactCard artefact={focal} />
            ) : nowBeat ? (
              <p className="ps-act-waiting">
                {nowBeat.state === "upcoming" || nowBeat.handoff.status === "waiting_upstream"
                  ? nowBeat.handoff.detail
                  : `${nowBeat.owner.label} will produce the next artefact when this beat is ready.`}
              </p>
            ) : null}
          </div>

          {showGate ? (
            <FocalGate actions={actions} leaseUntil={mission.job.leaseUntil ?? null} />
          ) : null}
          {!showGate && actions.exportSlot && mission.exportBody ? (
            <div className="ps-theatre-gate">{actions.exportSlot}</div>
          ) : null}
        </>
      ) : (
        <p className="ps-act-waiting">Approve the plan to open the product-build sequence.</p>
      )}

      <div className="ps-theatre-footnotes">
        <details>
          <summary>Research mode & tools</summary>
          {(() => {
            const webTool = actions.research.tools.find((t) => t.id === "web_search");
            const webReady = Boolean(webTool?.available);
            return (
              <p className="ps-research-readiness-chip mt-2" data-ready={webReady} role="status">
                {webReady
                  ? (webTool?.label ?? "Web research ready")
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
        {selected ? (
          <p>
            Contribution: {selected.contribution} · Handoff:{" "}
            {selected.handoff.status.replaceAll("_", " ")}
            {selected.handoff.detail ? ` · ${selected.handoff.detail}` : ""}
          </p>
        ) : null}
        <p>
          {brief.roughTime.label} · {commerceSnapshot(mission).unitLabel} · Usage{" "}
          {mission.usageConsumed}/{mission.usageCeiling} ·{" "}
          {STAFFING_BAND_LABELS[brief.team.staffing.band]}
        </p>
        {actions.next.id !== "export" && mission.exportBody ? (
          <div className="mt-2">{actions.exportSlot}</div>
        ) : null}
      </div>
    </section>
  );
}
