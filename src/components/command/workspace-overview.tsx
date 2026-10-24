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
    missions.filter((m) => m.nextTitle === "Record your decision").length +
    old.filter((m) => m.status === "awaiting_approval").length;
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
            <span>Saved mission record</span>
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
            <p className="ps-error">Mission activity could not load. Refresh to try again.</p>
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
            missions.slice(0, 5).map((m) => {
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
                      <span key={s} className={index >= i ? "is-done" : ""} />
                    ))}
                  </div>
                  <p>
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
