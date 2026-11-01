/**
 * The Workroom — see how the team plans and does the work on your project.
 * Board, each agent's work plan, the plan's order and the team's capacity; all from the
 * delivery engine's records. Gates stay yours: the board shows them, never passes them.
 */
import { useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { BUILD_STATUS_LABEL } from "@/lib/pilot-mission/delivery-room";
import type { WorkCard, Workroom as WorkroomModel } from "@/lib/pilot-mission/workroom";

type Tab = "board" | "timeline" | "team";

function Owner({ card, size = 24 }: { card: WorkCard; size?: number }) {
  return card.gate ? (
    <span className="room-build-you" style={{ width: size, height: size }} aria-hidden="true">
      You
    </span>
  ) : (
    <AgentAvatar name={card.owner} role={card.role} size={size} />
  );
}

function CardButton({
  card,
  active,
  onOpen,
}: {
  card: WorkCard;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="wr-card"
      data-status={card.status}
      aria-pressed={active}
      onClick={onOpen}
    >
      <span className="wr-card-top">
        <span className="room-mono">{card.gate ? "Your decision" : card.stage}</span>
        <span className="wr-status">{BUILD_STATUS_LABEL[card.status]}</span>
      </span>
      <b>{card.title}</b>
      <span className="wr-card-foot">
        <Owner card={card} />
        <span>{card.gate ? "You" : card.owner}</span>
        {card.output ? <em>{card.output.production}</em> : null}
      </span>
    </button>
  );
}

function WorkPlan({ card }: { card: WorkCard }) {
  return (
    <aside className="wr-plan" aria-label={`Work plan: ${card.title}`}>
      <div className="wr-plan-head">
        <Owner card={card} size={40} />
        <div>
          <b>{card.title}</b>
          <span>
            {card.gate ? "Your decision" : `${card.owner} · ${card.role}`} ·{" "}
            {BUILD_STATUS_LABEL[card.status]}
          </span>
        </div>
      </div>
      {card.plan.goal ? (
        <section>
          <span className="room-mono">The job</span>
          <p>{card.plan.goal}</p>
        </section>
      ) : null}
      {card.plan.mustInclude.length ? (
        <section>
          <span className="room-mono">What the output must include</span>
          <ul className="wr-checklist">
            {card.plan.mustInclude.map((s) => (
              <li key={s} data-done={card.status === "done" ? "true" : undefined}>
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {card.plan.check ? (
        <section>
          <span className="room-mono">Done when</span>
          <p>{card.plan.check}</p>
        </section>
      ) : null}
      {card.plan.buildsOn.length ? (
        <section>
          <span className="room-mono">Builds on</span>
          <ul className="wr-deps">
            {card.plan.buildsOn.map((d) => (
              <li key={d.title} data-done={d.done ? "true" : undefined}>
                {d.title}
                <span>{d.done ? "ready" : "waiting"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {card.plan.unblocks.length ? (
        <section>
          <span className="room-mono">Unblocks</span>
          <p>{card.plan.unblocks.join(" · ")}</p>
        </section>
      ) : null}
      {!card.gate ? (
        <section>
          <span className="room-mono">Usage</span>
          <p>
            {card.usage.used} of {card.usage.budget} budgeted units used
          </p>
        </section>
      ) : null}
      {card.output ? (
        <section>
          <span className="room-mono">Output</span>
          <p>
            <b>{card.output.title}</b> — {card.output.production}
            {card.output.quality.length ? ` · ${card.output.quality.join(", ")}` : ""}
          </p>
        </section>
      ) : null}
    </aside>
  );
}

export function Workroom({
  model,
  initialTab = "board",
}: {
  model: WorkroomModel;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const first = model.cards.find((c) => c.column === "needs_you" || c.column === "working");
  const [openId, setOpenId] = useState<string | null>(
    first?.taskId ?? model.cards[0]?.taskId ?? null,
  );
  const open = model.cards.find((c) => c.taskId === openId) ?? null;

  return (
    <div className="wr">
      <div className="wr-tabs" role="tablist" aria-label="Workroom views">
        {(
          [
            ["board", "Board"],
            ["timeline", "Timeline"],
            ["team", "Team"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className="wr-tab"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <span className="wr-usage">
          {model.usage.used} / {model.usage.budget} usage units
        </span>
      </div>

      {tab === "board" ? (
        <div className="wr-split">
          <div className="wr-board">
            {model.board.map((col) => (
              <section key={col.id} className="wr-col" data-col={col.id}>
                <header>
                  <h3>{col.label}</h3>
                  <span>{col.cards.length}</span>
                </header>
                {col.cards.map((c) => (
                  <CardButton
                    key={c.taskId}
                    card={c}
                    active={c.taskId === openId}
                    onOpen={() => setOpenId(c.taskId)}
                  />
                ))}
                {col.cards.length === 0 ? <p className="wr-empty">Nothing here</p> : null}
              </section>
            ))}
          </div>
          {open ? <WorkPlan card={open} /> : null}
        </div>
      ) : null}

      {tab === "timeline" ? (
        <ol className="wr-timeline">
          {model.timeline.map((lane) => (
            <li key={lane.stage}>
              <span className="room-mono">{lane.stage}</span>
              <div className="wr-lane">
                {lane.cards.map((c) => (
                  <CardButton
                    key={c.taskId}
                    card={c}
                    active={c.taskId === openId}
                    onOpen={() => {
                      setOpenId(c.taskId);
                      setTab("board");
                    }}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {tab === "team" ? (
        <ul className="wr-team">
          {model.team.map((m) => {
            const pct = m.usage.budget
              ? Math.min(100, Math.round((m.usage.used / m.usage.budget) * 100))
              : 0;
            return (
              <li key={m.name}>
                <AgentAvatar name={m.name} role={m.role} size={44} />
                <div className="wr-team-main">
                  <p>
                    <b>{m.name}</b> <span>{m.role}</span>
                  </p>
                  <p className="wr-team-now">
                    {m.current
                      ? `Working on: ${m.current}`
                      : m.tasks.done === m.tasks.total
                        ? "All tasks done"
                        : "Waiting for earlier work"}
                  </p>
                  <span
                    className="wr-bar"
                    role="progressbar"
                    aria-label={`${m.name} usage`}
                    aria-valuemin={0}
                    aria-valuemax={m.usage.budget}
                    aria-valuenow={m.usage.used}
                  >
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  <p className="wr-team-meta">
                    {m.tasks.done}/{m.tasks.total} tasks done · {m.usage.used} of {m.usage.budget}{" "}
                    units
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="plan-hint">
        Everything here comes from the build’s saved records. Agent names are display names for
        catalogue roles; usage is the units each task budgeted and spent.
      </p>
    </div>
  );
}
