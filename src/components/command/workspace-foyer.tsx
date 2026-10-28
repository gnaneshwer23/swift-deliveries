import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { orderAttention, attentionLabel } from "@/lib/workspace-attention";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";
import { ConversationPanel } from "@/components/command/conversation-panel";

/**
 * Studio foyer (Direction B): one composition — continue the freshest case, or brief a new one.
 * Cast, Agents office, and ops tools live elsewhere (Specialists / under the fold).
 */
export function WorkspaceFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.missions ?? [];
  const attention = orderAttention(missions).filter(
    (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
  );
  const hero = attention[0] ?? null;
  const others = attention.slice(1);

  return (
    <div className="ps-foyer">
      {home.isPending ? (
        <p className="ps-foyer-loading" role="status">
          Opening the stage…
        </p>
      ) : home.isError || (home.data && !home.data.ready) ? (
        <div role="alert" className="ps-foyer-stage">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <h2 className="ps-foyer-headline">Saved work could not load</h2>
          <p className="ps-foyer-lede">{home.data?.reason || "Check your connection and try again."}</p>
          <div className="ps-foyer-cta">
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              disabled={home.isFetching}
              onClick={() => void home.refetch()}
            >
              {home.isFetching ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      ) : hero ? (
        <section className="ps-foyer-stage" aria-label="Continue">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="ps-foyer-act">On stage · needs you</p>
          <h2 className="ps-foyer-headline">{hero.question}</h2>
          <p className="ps-foyer-lede">
            <span className="ps-foyer-gate">{attentionLabel(hero.next.id)}</span>
            <span className="ps-foyer-gate-sep" aria-hidden="true">
              —
            </span>
            {hero.nextTitle}
          </p>
          <div className="ps-foyer-cta">
            <Link
              to="/command/supervised/$missionId"
              params={{ missionId: hero.id }}
              className="cc-btn cc-btn-primary"
            >
              Open the briefing
              <ArrowUpRight className="inline size-4" aria-hidden="true" />
            </Link>
            <a href="#supervised-brief" className="cc-btn cc-btn-secondary">
              Start another case
            </a>
          </div>
          {others.length > 0 ? (
            <details className="ps-foyer-more">
              <summary>
                {others.length} other {others.length === 1 ? "case" : "cases"} waiting
              </summary>
              <ul className="ps-foyer-quiet-list">
                {others.map((m) => (
                  <li key={m.id}>
                    <Link to="/command/supervised/$missionId" params={{ missionId: m.id }}>
                      <span className="cc-muted text-xs">{attentionLabel(m.next.id)}</span>
                      <strong>{m.question}</strong>
                      <span className="cc-muted text-sm">
                        {m.nextTitle} <ArrowUpRight className="inline size-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : (
        <section className="ps-foyer-stage ps-foyer-stage-brief" aria-label="Start">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="ps-foyer-act">Act I · Brief</p>
          <h2 className="ps-foyer-headline">One product question. Agents build from there.</h2>
          <p className="ps-foyer-lede">
            A PM briefs the plan, cast, cost and time. You approve. Specialists research and produce
            artefacts — nothing external without your yes.
          </p>
        </section>
      )}

      <div className={hero ? "ps-foyer-secondary" : "ps-foyer-primary-brief"}>
        <SupervisedMissionStart tone={hero ? "secondary" : "hero"} />
      </div>

      <footer className="ps-foyer-footnotes">
        <p className="ps-foyer-side-links">
          <Link to="/command/portfolio">Portfolio</Link>
          <span aria-hidden="true">·</span>
          <Link to="/command/capabilities" hash="agents-office">
            Agents office
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/command/capabilities">Specialists</Link>
          <span aria-hidden="true">·</span>
          <Link to="/command/projects">Projects</Link>
        </p>
        <details>
          <summary>How work is produced</summary>
          <StudioReadiness />
          <p className="cc-muted text-xs mt-2 mb-0">
            Artefacts disclose Simulated draft or the model id. Search and voice stay off when keys
            are missing — never invented.
          </p>
        </details>
        <details id="studio-talk">
          <summary>Talk to DeliverX (typed + voice)</summary>
          <p className="cc-muted text-sm mt-2 mb-3">
            Same spine as the one-liner. Nothing is approved by voice alone.
          </p>
          <ConversationPanel />
        </details>
        {missions.length > 1 ? (
          <p className="cc-muted text-xs mb-0">
            {missions.length} saved cases
            {attention.length > 0 ? ` · ${attention.length} need you` : ""}.
          </p>
        ) : null}
      </footer>
    </div>
  );
}
