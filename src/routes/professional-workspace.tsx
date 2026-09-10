import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CheckCircle2, ArrowRight, Users, Calendar, FileText, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/professional-workspace")({
  head: () => ({
    meta: [
      { title: "Professional Workspace — DeliverX" },
      { name: "description", content: "Collaborate with role-based AI teammates in one workspace for meetings, artefacts, decisions and evidence." },
      { property: "og:title", content: "Professional Workspace — DeliverX" },
      { property: "og:description", content: "Collaborate with role-based AI teammates in one workspace for meetings, artefacts, decisions and evidence." },
    ],
  }),
  component: ProfessionalWorkspacePage,
});

const FEATURES = [
  {
    icon: Users,
    title: "Role-based AI teammates",
    body: "PM Copilot, Engineering Lead, Design Partner and more — each brings a perspective, not a replacement.",
  },
  {
    icon: Calendar,
    title: "Meetings that stay aligned",
    body: "AI drafts agendas, minutes and follow-ups for human review before anything is shared.",
  },
  {
    icon: FileText,
    title: "Living artefacts",
    body: "Charters, requirements, decisions and change logs are linked to evidence and decisions.",
  },
  {
    icon: MessageSquare,
    title: "Decisions with context",
    body: "Every decision records rationale, alternatives and stakeholders so teams can move fast without losing traceability.",
  },
];

function ProfessionalWorkspacePage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-label">Succeed in the role</span>
            <h1 className="mkt-section-title mt-3">Professional Workspace</h1>
            <p className="mkt-section-sub mx-auto">
              AI teammates help you plan, align and ship — while you stay in control of every
              decision.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--mkt-green)] px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[var(--mkt-green-m)]"
            >
              Join the pilot
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="mkt-card p-6">
                <div className="mkt-feature-icon mb-4">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-text2)]">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14 mkt-soft-panel p-6 text-center">
            <h2 className="font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
              Human-in-the-loop by design
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--mkt-text2)]">
              Every AI output is a draft. You review, edit and approve before it becomes a team
              commitment.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Drafted by AI", "Reviewed by you", "Approved by team"].map((item) => (
                <span key={item} className="mkt-trust-pill">
                  <CheckCircle2 className="size-3.5 text-[var(--mkt-green-l)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
