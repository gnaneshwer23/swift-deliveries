import { attentionLabel, orderAttention } from "@/lib/workspace-attention";
import "@/styles/psi-operations.css";
import { PSI_LAYER_LABELS, PSI_RECORD_LINKS } from "@/lib/psi-journey";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCheck,
  FileCheck2,
  Fingerprint,
  GitBranch,
  Layers3,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const FLOW = [
  {
    id: "evidence",
    title: PSI_LAYER_LABELS.evidence,
    detail: "Keep supplied sources, assumptions and gaps attached to the product question.",
    icon: BrainCircuit,
    output: "Evidence with context",
  },
  {
    id: "judgement",
    title: PSI_LAYER_LABELS.judgement,
    detail:
      "Compare options against the saved evidence. The owner records a decision bound to the proposal version.",
    icon: Fingerprint,
    output: "Your decision, with its reasoning",
  },
  {
    id: "delivery",
    title: PSI_LAYER_LABELS.delivery,
    detail:
      "Prepare a reviewable decision and experiment brief. A download is not permission to deploy or act externally.",
    icon: Layers3,
    output: "A reviewable artefact",
  },
  {
    id: "feedback",
    title: PSI_LAYER_LABELS.feedback,
    detail:
      "Supply an observed result, review it against the hypothesis, and approve any proposed follow-up separately.",
    icon: GitBranch,
    output: "An evidence-led next question",
  },
] as const;
const STAGES = ["brief", "evidence", "alternatives", "decision", "artefact", "exported"];
export function WorkspaceOverview() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const legacy = useQuery(commandCentreBootstrapQuery);
  const [step, setStep] = useState(0);
  const [recordId, setRecordId] = useState("");
  const missions = home.data?.missions ?? [];
  const old = legacy.data?.recentMissions ?? [];
  const waiting =
    missions.filter((m) => ["decide", "approve_follow_up"].includes(m.next.id)).length +
    old.filter((m) => m.status === "awaiting_approval").length;
  const attention = orderAttention(missions).filter(
    (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
  );
  const exported = missions.filter((m) => m.stage === "exported").length;
  const flow = FLOW[step]!;
  const records = [...missions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const record =
    records.find((m) => m.id === recordId) ??
    records.find((m) => m.stage !== "cancelled") ??
    records[0];
  const destination = PSI_RECORD_LINKS[flow.id];
  const countsReady = !!home.data?.ready && !!legacy.data && !home.isError && !legacy.isError;
  return (
    <>
      <section className="po-attention" aria-labelledby="attention-title">
        <div className="po-attention-heading">
          <div>
            <span className="po-overline">Your product workspace</span>
            <h2 id="attention-title">Move the next decision forward.</h2>
            <p>Pick up a saved question, inspect the work, and decide what happens next.</p>
          </div>
          <a href="#supervised-brief" className="cc-btn cc-btn-primary">
            New product question
          </a>
        </div>
        {home.isPending ? (
          <p role="status">Loading your saved work…</p>
        ) : home.isError || !home.data?.ready ? (
          <div role="alert">
            <p>{home.data?.reason || "Saved work could not load."}</p>
            <button className="cc-btn cc-btn-secondary" onClick={() => void home.refetch()}>
              Retry saved work
            </button>
          </div>
        ) : attention.length === 0 ? (
          <div className="po-first">
            <BrainCircuit size={36} />
            <div>
              <h3>Start with one product question.</h3>
              <p>
                Your brief becomes the shared record for evidence, options, your decision and a
                reviewable output.
              </p>
              <a href="#supervised-brief">Prepare your first brief</a>
            </div>
          </div>
        ) : (
          <div className="po-queue">
            {attention.slice(0, 3).map((m, index) => (
              <Link
                key={m.id}
                to="/command/supervised/$missionId"
                params={{ missionId: m.id }}
                className="po-queue-item"
                data-priority={index === 0 ? "first" : undefined}
              >
                <span className="po-queue-state" data-state={m.next.id}>
                  {attentionLabel(m.next.id)}
                </span>
                <h3>{m.question}</h3>
                <p>{m.objective}</p>
                <strong>
                  {m.nextTitle}
                  <ArrowUpRight size={17} />
                </strong>
              </Link>
            ))}
          </div>
        )}
        {old.some((m) =>
          ["awaiting_approval", "needs_clarification", "blocked", "failed"].includes(m.status),
        ) && (
          <div className="po-task-attention">
            <h3>Specialist work needing attention</h3>
            {old
              .filter((m) =>
                ["awaiting_approval", "needs_clarification", "blocked", "failed"].includes(
                  m.status,
                ),
              )
              .map((m) => (
                <Link key={m.id} to="/command/missions/$missionId" params={{ missionId: m.id }}>
                  <span>{m.title}</span>
                  <strong>
                    {m.status.replaceAll("_", " ")} <ArrowUpRight size={14} />
                  </strong>
                </Link>
              ))}
          </div>
        )}
        <div className="po-workspace-state">
          <span>Model configuration: {home.data?.providerLabel ?? "Checking…"}</span>
          <span>
            Usage units:{" "}
            {home.data?.usage
              ? `${home.data.usage.consumed} / ${home.data.usage.ceiling}`
              : "Unavailable"}
          </span>
        </div>
      </section>
      <section className="ps-stat-row" aria-label="Recorded workspace summary">
        <div className="ps-stat">
          <span>
            <Layers3 size={14} />
            Recent missions
          </span>
          <strong>{countsReady ? missions.length + old.length : "—"}</strong>
          <small>Across both saved mission lists</small>
        </div>
        <div className="ps-stat">
          <span>
            <ShieldCheck size={14} />
            Awaiting your decision
          </span>
          <strong>{countsReady ? waiting : "—"}</strong>
          <small>Recorded approval steps only</small>
        </div>
        <div className="ps-stat">
          <span>
            <FileCheck2 size={14} />
            Exported decision packs
          </span>
          <strong>{home.data?.ready && !home.isError ? exported : "—"}</strong>
          <small>Supervised mission records</small>
        </div>
        <div className="ps-stat">
          <span>
            <UsersRound size={14} />
            Roles available for planning
          </span>
          <strong>
            {WAVE1_AVAILABLE_IDS.length}
            <small> / 150</small>
          </strong>
          <small>Execution depends on tools and configuration</small>
        </div>
      </section>
      <section className="ps-journey">
        <div className="ps-section-heading">
          <div>
            <h2>Product Brain · your connected product record</h2>
            <p>
              Build a product, learn from the work, and keep the reasoning behind each decision.
            </p>
          </div>
          <Link to="/command/capabilities">
            Explore the workforce <ArrowUpRight size={13} />
          </Link>
        </div>
        {records.length > 0 && (
          <div className="ps-record-selector">
            <label htmlFor="product-record">Product question</label>
            <select
              id="product-record"
              value={record?.id ?? ""}
              onChange={(event) => setRecordId(event.target.value)}
            >
              {records.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.question}
                </option>
              ))}
            </select>
            <span>{record ? attentionLabel(record.next.id) : "Saved mission record"}</span>
          </div>
        )}
        {record && (
          <div className="po-record-facts" aria-label="Selected product record">
            <div>
              <small>Objective</small>
              <strong>{record.objective}</strong>
            </div>
            <div>
              <small>Comparison provenance</small>
              <span>{record.generation}</span>
            </div>
            <div>
              <small>Owner decision</small>
              <span>{record.decisionRecorded ? "Recorded · inspect scope" : "Not recorded"}</span>
            </div>
            <div>
              <small>Output / observed result</small>
              <span>
                {record.outputReady ? "Decision pack saved" : "No decision pack"} /{" "}
                {record.observationRecorded ? "Owner-supplied result" : "No observed result"}
              </span>
            </div>
          </div>
        )}
        <div className="ps-flow">
          {FLOW.map((item, i) => (
            <button key={item.title} aria-pressed={step === i} onClick={() => setStep(i)}>
              <item.icon size={24} />
              <strong>{item.title}</strong>
              <small>{item.output}</small>
            </button>
          ))}
        </div>
        <div className="ps-flow-detail">
          <p>
            <strong>{flow.title}.</strong> {flow.detail}
          </p>
          {record ? (
            <Link
              to="/command/supervised/$missionId"
              params={{ missionId: record.id }}
              hash={destination.hash}
            >
              {destination.label} →
            </Link>
          ) : (
            <a href="#supervised-brief">Start with a question →</a>
          )}
        </div>
      </section>
      <div className="ps-mission-grid">
        <section className="ps-mission-feed">
          <div className="ps-section-heading">
            <div>
              <h2>Mission activity</h2>
              <p>Your saved work and its next required action.</p>
            </div>
            <span className="ps-pill">Saved records</span>
          </div>
          {home.isError ? (
            <div role="alert">
              <p className="ps-error">Mission activity could not load.</p>
              <button className="cc-btn cc-btn-secondary" onClick={() => void home.refetch()}>
                Retry
              </button>
            </div>
          ) : home.isPending ? (
            <p className="ps-busy">Loading saved missions…</p>
          ) : !home.data?.ready ? (
            <p className="ps-error">{home.data?.reason}</p>
          ) : missions.length === 0 ? (
            <div className="ps-empty">
              <CheckCheck size={20} />
              <p>
                No supervised missions yet. Save your first product question below to create an
                evidence and decision trail.
              </p>
            </div>
          ) : (
            orderAttention(missions).map((m) => {
              const index = STAGES.indexOf(m.stage);
              return (
                <Link
                  className="ps-mission-item"
                  key={m.id}
                  to="/command/supervised/$missionId"
                  params={{ missionId: m.id }}
                >
                  <div>
                    <strong>{m.question}</strong>
                    <ArrowUpRight size={15} />
                  </div>
                  <div className="ps-stage-track" aria-label={`Recorded stage: ${m.stage}`}>
                    {STAGES.map((s, i) => (
                      <span key={s} className={index >= i ? "is-done" : ""} title={s} />
                    ))}
                  </div>
                  <p>
                    {m.stage === "cancelled" ? "Cancelled" : `Saved stage: ${m.stage}`} ·{" "}
                    {m.nextTitle} · {m.usageConsumed} usage units
                  </p>
                </Link>
              );
            })
          )}
        </section>
        <aside className="ps-mission-aside">
          <ShieldCheck size={28} />
          <h3>Progress you can inspect.</h3>
          <p>
            Task completion, owner approval and measured product outcomes are different signals.
            Each keeps its own record.
          </p>
          <Link to="/command/capabilities">Inspect specialist involvement →</Link>
          <p style={{ marginTop: 20 }}>
            Model configuration: {home.data?.providerLabel ?? "Checking…"}
          </p>
        </aside>
      </div>
    </>
  );
}
