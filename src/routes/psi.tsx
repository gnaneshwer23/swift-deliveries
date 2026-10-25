import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  FileCheck2,
  Gauge,
  Gavel,
  GitBranch,
  KeyRound,
  Layers3,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  PlugZap,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { PlatformStackIllustration } from "@/components/illustrations/platform-illustrations";
import { WORKFORCE_AVAILABLE_IDS, WORKFORCE_TOTAL } from "@/lib/marketing/workforce-summary";

export const Route = createFileRoute("/psi")({
  head: () =>
    pageHead(
      "/psi",
      "Platform — What DeliverX can do today | DeliverX",
      "The DeliverX platform layer by layer: Product Brain, the mission engine, specialists, deliberation, approvals, usage limits, provenance and model mode, each marked live, opt-in or planned.",
    ),
  component: Platform,
});

type Status = "live" | "opt-in" | "planned";

const LAYERS: Array<{ name: string; icon: LucideIcon; does: string }> = [
  {
    name: "Command",
    icon: MessageSquareText,
    does: "Understands your objective, asks what is missing and plans the mission.",
  },
  {
    name: "Departments",
    icon: Users,
    does: "Groups specialists by discipline and assembles the team a mission needs.",
  },
  {
    name: "Execution",
    icon: Layers3,
    does: "Runs bounded tasks in order; a task never starts on failed upstream work.",
  },
  {
    name: "Quality & evidence",
    icon: ShieldCheck,
    does: "Checks each handoff and labels how every artefact was produced and reviewed.",
  },
];

const CAPABILITIES: Array<{
  id: string;
  icon: LucideIcon;
  name: string;
  status: Status;
  does: string;
  control: string;
  next?: string;
  see?: { to: string; hash?: string; label: string };
}> = [
  {
    id: "product-brain",
    icon: BrainCircuit,
    name: "Product Brain",
    status: "live",
    does: "Keeps one record per product: the brief, supplied sources, evidence, decisions, artefacts and what you observed after.",
    control: "You choose what goes in. Missing evidence stays visible as a gap, never filled in.",
    next: "A connected knowledge graph across products is planned.",
    see: { to: "/", hash: "explore-product", label: "Explore the Product Brain" },
  },
  {
    id: "missions",
    icon: ListChecks,
    name: "Mission engine",
    status: "live",
    does: "Turns one sentence into a plan with tasks, a team, checks and a usage estimate, then runs the tasks in order.",
    control: "Nothing runs until you approve the plan. You can change or cancel it first.",
    see: { to: "/how-it-works", label: "Watch a mission run" },
  },
  {
    id: "specialists",
    icon: Users,
    name: "Specialist workforce",
    status: "live",
    does: `${WORKFORCE_TOTAL} roles across 15 departments, each with one job and a limit on what it may do.`,
    control: `${WORKFORCE_AVAILABLE_IDS.length} roles can be assigned today; the rest stay unavailable until they pass their checks.`,
    see: { to: "/ai-agents", label: "Browse the specialists" },
  },
  {
    id: "deliberation",
    icon: GitBranch,
    name: "Decision panels",
    status: "live",
    does: "Specialists score options independently, then critique. Security, QA and Finance hold hard vetoes; an option needs 60% weighted support.",
    control:
      "High-impact decisions and weak evidence always come to you. Dissent stays on the record.",
  },
  {
    id: "approvals",
    icon: Gavel,
    name: "Approvals and gates",
    status: "live",
    does: "Plans, lifecycle gates and anything that would act outside DeliverX each need an explicit human approval.",
    control: "Agents can stop at a gate. Only a person can pass one.",
  },
  {
    id: "usage",
    icon: Gauge,
    name: "Usage limits",
    status: "live",
    does: "Every billable step is counted against the workspace ceiling before it runs.",
    control: "When the ceiling is reached, further billable steps stop. Nothing runs on credit.",
  },
  {
    id: "provenance",
    icon: FileCheck2,
    name: "Provenance and quality labels",
    status: "live",
    does: "Every artefact says whether it is a model output or a simulated draft, and is labelled Agent-reviewed, Automatically tested, Human-reviewed or Externally attested.",
    control: "Exports include project-manifest.json, which lists what was simulated.",
  },
  {
    id: "model-mode",
    icon: Cpu,
    name: "Model mode",
    status: "opt-in",
    does: "Uses a configured model provider instead of deterministic drafts.",
    control:
      "Off unless you switch it on. Text that looks like personal identifiers is never sent.",
  },
  {
    id: "integrations",
    icon: PlugZap,
    name: "Connected tools and deployment",
    status: "planned",
    does: "Pull evidence from your tools, keep runtime test logs and publish approved previews.",
    control: "Each will need its own permission and approval before it can act.",
  },
];

const STATUS_LABEL: Record<Status, string> = {
  live: "Live",
  "opt-in": "Opt-in",
  planned: "Planned",
};

function Platform() {
  return (
    <MarketingLayout>
      <div className="plt">
        <section className="plt-hero">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">Platform</p>
            <h1>
              What DeliverX can do,
              <br />
              <span className="dxl-grad">and what it can’t yet.</span>
            </h1>
            <p>
              A plain reference to the platform behind every mission: how it is layered, what each
              capability does, what you control, and whether it is live today.
            </p>
          </div>
        </section>

        <section className="plt-section" id="platform-architecture">
          <div className="dxl-wrap">
            <div className="plt-heading">
              <h2>Five layers, one rule.</h2>
              <p>
                Work moves down through four layers. Governance wraps all of them, so permissions,
                limits and approvals apply everywhere, not as a final check.
              </p>
            </div>
            <div className="plt-layers">
              <div className="plt-stack ix">
                <PlatformStackIllustration
                  layers={LAYERS}
                  governance={{ name: "Governance", icon: KeyRound }}
                />
              </div>
              <div className="plt-layer-list">
                <ol>
                  {LAYERS.map((l, i) => (
                    <li key={l.name}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <strong>{l.name}</strong>
                      <p>{l.does}</p>
                    </li>
                  ))}
                </ol>
                <aside>
                  <KeyRound size={20} aria-hidden="true" />
                  <strong>Governance</strong>
                  <p>
                    Workspace isolation, permissions, usage ceilings, approvals and the audit trail,
                    across every layer.
                  </p>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="plt-section" id="capabilities">
          <div className="dxl-wrap">
            <div className="plt-heading">
              <h2>Capabilities.</h2>
              <p>
                Each one marked live, opt-in or planned. Nothing planned is presented as working.
              </p>
            </div>
            <ul className="plt-caps">
              {CAPABILITIES.map((c) => (
                <li key={c.id} id={c.id} data-status={c.status}>
                  <div className="plt-cap-top">
                    <span className="plt-cap-icon">
                      <c.icon size={18} aria-hidden="true" />
                    </span>
                    <span className="plt-badge" data-status={c.status}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.does}</p>
                  <div className="plt-control">
                    <small>You control</small>
                    {c.control}
                  </div>
                  {c.next && <p className="plt-next">{c.next}</p>}
                  {c.see && (
                    <Link
                      to={c.see.to}
                      {...(c.see.hash ? { hash: c.see.hash } : {})}
                      className="plt-see"
                    >
                      {c.see.label} <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="plt-close">
          <div className="dxl-wrap">
            <h2>See the platform run a mission.</h2>
            <div className="psi-actions">
              <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
                Watch a mission <ArrowRight size={16} />
              </Link>
              <Link to="/security" className="dxl-btn dxl-btn-ghost">
                Security details
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
