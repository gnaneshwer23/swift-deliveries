import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { ConversationPanel } from "@/components/command/conversation-panel";
import { StudioReadiness } from "@/components/command/studio-readiness";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { missionNeedsAttention } from "@/lib/pilot-mission/portfolio";
import { STATUS_LABELS, type WfMission } from "@/lib/workforce/types";
import { INBOX_KIND_LABELS } from "@/lib/workforce/owner-inbox";
import { commandCentreBootstrapQuery, ownerInboxQuery } from "@/lib/workforce-queries";

const PREVIEW_LIMIT = 4;
const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

type WorkRow = {
  id: string;
  kind: "case" | "mission";
  title: string;
  context: string;
  stage: string;
  nextAction: string;
  updatedAt: string;
  needsAttention: boolean;
};

function workforceNextAction(mission: WfMission): string {
  if (mission.status === "needs_clarification") return "Answer question";
  if (mission.status === "awaiting_approval") return "Review approval";
  if (mission.status === "reviewing") return "Open mission";
  if (mission.status === "blocked" || mission.status === "failed") return "Inspect issue";
  if (mission.status === "completed" || mission.status === "partially_completed")
    return "View outcome";
  return "Open mission";
}

/** Home surfaces decisions and current work; the full record lives in each dossier. */
export function ExecutiveStudioDashboard() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const workforce = useQuery(commandCentreBootstrapQuery);
  const inbox = useQuery(ownerInboxQuery);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);

  const missions = home.data?.ready ? home.data.missions : [];
  const workforceMissions = workforce.data?.recentMissions ?? [];
  const projects = workforce.data?.projects ?? [];
  const workforceAttention = inbox.data?.items ?? [];
  const caseAttention = missions.filter(
    (mission) => !mission.archived && missionNeedsAttention(mission.next.id),
  );
  const attentionCount = workforceAttention.length + caseAttention.length;

  const cases: WorkRow[] = missions
    .filter((mission) => !mission.archived)
    .map((mission) => ({
      id: mission.id,
      kind: "case",
      title: mission.question,
      context: "Investigation",
      stage: mission.stage,
      nextAction: mission.nextTitle,
      updatedAt: mission.updatedAt,
      needsAttention: missionNeedsAttention(mission.next.id),
    }));
  const recent: WorkRow[] = workforceMissions.map((mission) => ({
    id: mission.id,
    kind: "mission",
    title: mission.title,
    context: projects.find((project) => project.id === mission.projectId)?.name ?? "Project",
    stage: STATUS_LABELS[mission.status],
    nextAction: workforceNextAction(mission),
    updatedAt: mission.updatedAt,
    needsAttention: workforceAttention.some((item) => item.missionId === mission.id),
  }));
  const work = [...cases, ...recent].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );

  const filtered = work.filter((item) => {
    const term = query.trim().toLowerCase();
    return (
      !term ||
      [item.title, item.context, item.stage, item.nextAction].some((value) =>
        value.toLowerCase().includes(term),
      )
    );
  });
  const visibleWork = showAll || query ? filtered : filtered.slice(0, PREVIEW_LIMIT);
  const visibleWorkforceAttention = workforceAttention.slice(0, PREVIEW_LIMIT);
  const visibleCaseAttention = caseAttention.slice(
    0,
    Math.max(0, PREVIEW_LIMIT - visibleWorkforceAttention.length),
  );

  return (
    <div className="ps-exec-dashboard ps-room ps-room-wide ps-dispatch">
      <header className="ps-dispatch-header">
        <div>
          <p className="ps-exec-section-kicker">DeliverX Studio</p>
          <h1>Good to have you back.</h1>
          <p>Start an investigation or pick up where your team needs you.</p>
        </div>
        <Link to="/command/portfolio" className="cc-btn cc-btn-secondary">
          Portfolio <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div className="ps-dispatch-grid">
        <section className="ps-dispatch-command" aria-label="New investigation">
          <div className="ps-dispatch-section-heading">
            <span className="ps-dispatch-index">01</span>
            <h2>New investigation</h2>
          </div>
          <SupervisedMissionStart tone="hero" />
          <details
            className="ps-dispatch-conversation"
            onToggle={(event) => setConversationOpen(event.currentTarget.open)}
          >
            <summary>Ask about existing work</summary>
            {conversationOpen ? <ConversationPanel /> : null}
          </details>
        </section>

        <section className="ps-dispatch-attention" aria-labelledby="dispatch-attention-title">
          <div className="ps-dispatch-section-heading">
            <span className="ps-dispatch-index">02</span>
            <h2 id="dispatch-attention-title">Needs you</h2>
            {attentionCount > 0 ? (
              <span className="ps-exec-count-badge" aria-label={`${attentionCount} actions`}>
                {attentionCount}
              </span>
            ) : null}
          </div>
          {home.isPending || inbox.isPending ? (
            <p className="ps-dispatch-empty" role="status">
              Checking for decisions…
            </p>
          ) : home.isError || inbox.isError || (home.data && !home.data.ready) ? (
            <div className="ps-dispatch-empty" role="alert">
              <p>Some decisions could not load.</p>
              <button
                type="button"
                onClick={() => {
                  void home.refetch();
                  void inbox.refetch();
                }}
              >
                Retry
              </button>
            </div>
          ) : attentionCount === 0 ? (
            <p className="ps-dispatch-empty">No decisions waiting right now.</p>
          ) : (
            <>
              <ul className="ps-dispatch-action-list">
                {visibleWorkforceAttention.map((item) => (
                  <li key={`${item.kind}-${item.missionId}-${item.taskId ?? ""}`}>
                    <Link
                      to="/command/missions/$missionId"
                      params={{ missionId: item.missionId }}
                      {...(item.hash ? { hash: item.hash } : {})}
                    >
                      <span className="ps-dispatch-action-kind">
                        {INBOX_KIND_LABELS[item.kind]}
                      </span>
                      <strong>{item.action}</strong>
                      <small>{item.missionTitle}</small>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {visibleCaseAttention.map((mission) => (
                  <li key={mission.id}>
                    <Link
                      to="/command/supervised/$missionId"
                      params={{ missionId: mission.id }}
                      hash="mission-inspect"
                    >
                      <span className="ps-dispatch-action-kind">{mission.stage}</span>
                      <strong>{mission.nextTitle}</strong>
                      <small>{mission.question}</small>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {attentionCount > PREVIEW_LIMIT || inbox.data?.truncated ? (
                <Link to="/command/portfolio" className="ps-dispatch-more">
                  View all decisions <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="ps-dispatch-work" aria-labelledby="dispatch-work-title">
        <div className="ps-dispatch-work-head">
          <div className="ps-dispatch-section-heading">
            <span className="ps-dispatch-index">03</span>
            <h2 id="dispatch-work-title">Recent work</h2>
            {!home.isPending && !workforce.isPending ? (
              <span className="ps-dispatch-count">{work.length}</span>
            ) : null}
          </div>
          <Link to="/command/projects" className="ps-dispatch-more ps-dispatch-projects-link">
            Projects <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <label className="ps-dispatch-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search recent work</span>
            <input
              type="search"
              placeholder="Search recent work"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {home.isPending || workforce.isPending ? (
          <p className="ps-dispatch-empty" role="status">
            Loading saved work…
          </p>
        ) : home.isError || workforce.isError || (home.data && !home.data.ready) ? (
          <div className="ps-dispatch-empty" role="alert">
            <p>Saved work could not load completely.</p>
            <button
              type="button"
              onClick={() => {
                void home.refetch();
                void workforce.refetch();
              }}
            >
              Retry
            </button>
          </div>
        ) : visibleWork.length === 0 ? (
          <p className="ps-dispatch-empty">
            {query
              ? "No work matches that search."
              : "Your investigations and missions will appear here."}
          </p>
        ) : (
          <>
            <ul className="ps-dispatch-work-list">
              {visibleWork.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    to={
                      item.kind === "case"
                        ? "/command/supervised/$missionId"
                        : "/command/missions/$missionId"
                    }
                    params={{ missionId: item.id }}
                  >
                    <span className="ps-dispatch-work-type">{item.context}</span>
                    <strong>{item.title}</strong>
                    <span className="ps-dispatch-work-stage" data-attention={item.needsAttention}>
                      {item.stage}
                    </span>
                    <span className="ps-dispatch-work-next">{item.nextAction}</span>
                    <time dateTime={item.updatedAt}>{dateLabel(item.updatedAt)}</time>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            {!query && filtered.length > PREVIEW_LIMIT ? (
              <button
                type="button"
                className="ps-dispatch-more"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show fewer" : "Show more recent work"}
              </button>
            ) : null}
          </>
        )}
      </section>

      <footer className="ps-dispatch-footer">
        <details>
          <summary>System readiness</summary>
          <StudioReadiness />
        </details>
      </footer>
    </div>
  );
}
