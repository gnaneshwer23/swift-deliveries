import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Code2,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { BRIEF_PRESETS } from "@/lib/marketing/brief-presets";
import { EMPTY_BRIEF, type ProductBrief } from "@/lib/marketing/product-resources";
import { WORKFORCE_INTENTS, type WorkforceIntent } from "@/lib/marketing/workforce-summary";
import { savePilotBrief } from "@/lib/pilot/storage";
import { INTENT_LABELS } from "@/lib/workforce/types";

export const Route = createFileRoute("/solutions")({
  head: () =>
    pageHead(
      "/solutions",
      "Use cases — Start from a situation like yours | DeliverX",
      "Five common starting points: validating an idea, improving a product, scoping client work, prototyping a feature and learning by building. Each opens a ready-made brief.",
    ),
  component: UseCases,
});

const CASES: Array<{
  id: string;
  icon: LucideIcon;
  who: string;
  situation: string;
  intent: WorkforceIntent;
  get: string;
  brief: ProductBrief;
}> = [
  {
    id: "founder",
    icon: Lightbulb,
    who: "Founders",
    situation: "You have an idea and need to know which customer problem is worth building for.",
    intent: "investigate",
    get: "An evidence brief, compared options and a discovery plan.",
    brief: BRIEF_PRESETS.founder.brief,
  },
  {
    id: "team",
    icon: TrendingUp,
    who: "Product managers",
    situation:
      "Users drop off somewhere in your product and the team disagrees on what to fix first.",
    intent: "improve",
    get: "A decision record and a scoped experiment you can measure.",
    brief: BRIEF_PRESETS.team.brief,
  },
  {
    id: "agency",
    icon: Briefcase,
    who: "Consultants and agencies",
    situation: "A client wants a product scoped quickly, with reasoning they can check.",
    intent: "investigate",
    get: "A scoped brief, the options weighed and an export you can hand over.",
    brief: {
      ...EMPTY_BRIEF,
      product: "Client product scope",
      audience: "The client's target users; confirm the segment with the client.",
      problem: "What should the first release of the client's product include?",
      objective: "Agree a bounded first release with the reasoning on record.",
      constraints: "No contact with the client's customers and no spending without approval.",
      evidence: "Supply the client's brief and any research they have shared.",
    },
  },
  {
    id: "engineering",
    icon: Code2,
    who: "Engineering leads",
    situation: "You need a reviewable prototype and an architecture note before committing a team.",
    intent: "prototype",
    get: "An HTML prototype, an architecture note and review findings.",
    brief: {
      ...EMPTY_BRIEF,
      product: "Feature prototype",
      audience: "The users of the feature; state who they are.",
      problem: "Prototype the smallest version of this feature that we can review.",
      objective: "A prototype and architecture note good enough to decide whether to build.",
      constraints: "Prototype only. No deployment or changes to the live product.",
      evidence: "Supply the requirement and any constraints from the current system.",
    },
  },
  {
    id: "student",
    icon: GraduationCap,
    who: "Students and new builders",
    situation: "You want to learn product work by doing it on a real idea, not an exercise.",
    intent: "prototype",
    get: "A brief, a decision record and a reflection on what changed your mind.",
    brief: BRIEF_PRESETS.student.brief,
  },
];

function UseCases() {
  const navigate = useNavigate();
  const start = (brief: ProductBrief) => {
    savePilotBrief(brief);
    void navigate({ to: "/onboarding" });
  };
  return (
    <MarketingLayout>
      <div className="ucs">
        <section className="ucs-hero">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">Use cases</p>
            <h1>
              Start from a situation
              <br />
              <span className="dxl-grad">like yours.</span>
            </h1>
            <p>
              Pick the one closest to where you are. It opens with a ready-made brief you can edit,
              and the team that usually starts on it.
            </p>
          </div>
        </section>
        <section className="ucs-section">
          <div className="dxl-wrap">
            <ul className="ucs-grid">
              {CASES.map((c) => (
                <li key={c.id} id={c.id}>
                  <span className="ucs-icon">
                    <c.icon size={20} aria-hidden="true" />
                  </span>
                  <h2>{c.who}</h2>
                  <p className="ucs-situation">{c.situation}</p>
                  <blockquote>“{c.brief.problem}”</blockquote>
                  <dl>
                    <div>
                      <dt>Mission</dt>
                      <dd>{INTENT_LABELS[c.intent]}</dd>
                    </div>
                    <div>
                      <dt>Starting team</dt>
                      <dd>{WORKFORCE_INTENTS[c.intent].length} specialists</dd>
                    </div>
                  </dl>
                  <p className="ucs-get">
                    <strong>You get</strong> {c.get}
                  </p>
                  <button type="button" className="ucs-start" onClick={() => start(c.brief)}>
                    Start with this brief <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="ucs-close">
          <div className="dxl-wrap">
            <h2>None of these? Describe your own.</h2>
            <div className="psi-actions">
              <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
                Start building <ArrowRight size={16} />
              </Link>
              <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-ghost">
                Write a brief first
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
