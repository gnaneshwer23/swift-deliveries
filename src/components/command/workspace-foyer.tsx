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
        <p className="cc-muted" role="status">
          Loading saved work…
        </p>
      ) : home.isError || (home.data && !home.data.ready) ? (
        <div role="alert" className="cc-panel">
          <p>{home.data?.reason || "Saved work could not load."}</p>
          <button
            type="button"
            className="cc-btn cc-btn-secondary mt-3"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : hero ? (
        <section className="ps-foyer-stage" aria-label="Continue">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Continue</p>
          <h2 className="ps-foyer-headline">{hero.question}</h2>
          <p className="ps-foyer-lede">
            {attentionLabel(hero.next.id)} · {hero.nextTitle}
          </p>
          <div className="ps-foyer-cta">
            <Link
              to="/command/supervised/$missionId"
              params={{ missionId: hero.id }}
              className="cc-btn cc-btn-primary"
            >
              Continue
              <ArrowUpRight className="inline size-4" aria-hidden="true" />
            </Link>
            <a href="#supervised-brief" className="cc-btn cc-btn-secondary">
              Brief a new case
            </a>
          </div>
          {others.length > 0 ? (
            <details className="ps-foyer-more">
              <summary>
                {others.length} other {others.length === 1 ? "case" : "cases"} needing you
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
          <p className="ps-foyer-side-links">
            <Link to="/command/capabilities" hash="agents-office">
              Agents office
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/command/capabilities">Specialists</Link>
          </p>
        </section>
      ) : (
        <section className="ps-foyer-stage ps-foyer-stage-brief" aria-label="Start">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Start</p>
          <h2 className="ps-foyer-headline">One product question. Specialists take it from here.</h2>
          <p className="ps-foyer-lede">
            Brief the case, review the plan, approve what moves. Nothing external runs without you.
          </p>
        </section>
      )}

      <div className={hero ? "ps-foyer-secondary" : undefined}>
        <SupervisedMissionStart tone={hero ? "secondary" : "hero"} />
      </div>

      <details className="ps-legacy mt-2" id="studio-talk">
        <summary>Talk to DeliverX (typed + voice) — same path as the brief</summary>
        <p className="cc-muted text-sm mt-2 mb-3">
          Speech becomes a transcript that uses the same cards as typing. Nothing is approved by
          voice alone — you still click. If voice keys are missing, the controls say so honestly;
          typing always works.
        </p>
        <ConversationPanel />
      </details>

      <footer className="ps-foyer-footnotes">
        <details>
          <summary>How this workspace produces work</summary>
          <StudioReadiness />
          <p className="cc-muted text-xs mt-2 mb-0">
            Artefacts disclose Simulated draft or the model id used. Voice and search stay off when
            keys are missing — they are never invented.
          </p>
        </details>
        {missions.length > 1 ? (
          <p className="cc-muted text-xs mb-0">
            {missions.length} saved investigations
            {attention.length > 0 ? ` · ${attention.length} need attention` : ""}.
          </p>
        ) : null}
      </footer>
    </div>
  );
}
