import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Compass, GraduationCap, Route as RouteIcon } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { BRIEF_PRESETS, type BriefPreset } from "@/lib/marketing/brief-presets";

export const Route = createFileRoute("/solutions")({
  head: () =>
    pageHead(
      "/solutions",
      "Use cases — Find your first product question | DeliverX",
      "Choose an editable starting brief for validating an idea, improving a product or learning by building. See what you bring and what the work can produce.",
    ),
  component: UseCases,
});
const STARTERS = [
  {
    key: "founder",
    icon: Compass,
    short: "Find the right problem",
    image: "role-evidence.webp",
    alt: "Research documents and a magnifying glass, representing an evidence-led starting point.",
  },
  {
    key: "team",
    icon: RouteIcon,
    short: "Choose the next improvement",
    image: "mission-workbench-v1.webp",
    alt: "A product question connected to evidence, options, an owner decision and a reviewable brief.",
  },
  {
    key: "student",
    icon: GraduationCap,
    short: "Learn through real decisions",
    image: "learning-workbench-v1.webp",
    alt: "A learning workbench linking a measurement plan, observations and the next question.",
  },
] as const;
function UseCases() {
  const [selected, setSelected] = useState<BriefPreset>("founder");
  const item = BRIEF_PRESETS[selected];
  const visual = STARTERS.find((s) => s.key === selected)!;
  return (
    <MarketingLayout>
      <div className="public-use-cases">
        <section className="public-start-opening">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">Use cases · your starting point</p>
            <h1>
              Different questions.
              <br />
              One way to move forward.
            </h1>
            <p>
              Bring the product question in front of you. See the evidence, decisions and reviewable
              work it needs—then make the brief your own.
            </p>
            <div
              className="public-starter-choices"
              role="group"
              aria-label="Choose a product starting point"
            >
              {STARTERS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={selected === s.key}
                  onClick={() => setSelected(s.key)}
                >
                  <s.icon size={21} aria-hidden="true" />
                  <strong>{BRIEF_PRESETS[s.key].label}</strong>
                  <span>{s.short}</span>
                  <Check size={16} className="public-starter-check" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="public-start-detail">
          <div className="dxl-wrap">
            <div className="public-start-workspace">
              <div className="public-start-art">
                <img
                  src={`/illustrations/${visual.image}`}
                  width="1536"
                  height="1024"
                  alt={visual.alt}
                />
                <span>Illustrative workflow · no mission runs here</span>
              </div>
              <div className="public-start-copy" aria-live="polite">
                <p className="dxl-eyebrow">{item.audience}</p>
                <h2>{item.question}</h2>
                <p>
                  Your editable starter includes an objective, constraints and an explicit place for
                  missing evidence.
                </p>
                <Link
                  to="/resources"
                  search={{ useCase: selected }}
                  hash="brief-builder"
                  className="dxl-btn dxl-btn-primary"
                >
                  Prepare this brief <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <small>
                  Already have a draft? Your saved edits stay in place until you choose to replace
                  them.
                </small>
              </div>
            </div>
            <ol className="public-start-flow" aria-label={`${item.label}: input to output`}>
              <li>
                <span>01 · You bring</span>
                <strong>{item.input}</strong>
              </li>
              <li>
                <span>02 · Specialist contributions</span>
                <strong>{item.work}</strong>
              </li>
              <li>
                <span>03 · You decide</span>
                <strong>Review the evidence and agree a bounded next step</strong>
              </li>
              <li>
                <span>04 · Proposed takeaway</span>
                <strong>{item.output}</strong>
              </li>
            </ol>
            <p className="public-example-note">
              Starting-point examples, not customer results. Pilot scope and enabled capabilities
              are agreed before work starts. Students use the same evidence standards, with space to
              reflect on the decisions.
            </p>
          </div>
        </section>
        <section className="public-next-section">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Choose your next step</p>
              <h2>
                Inspect an example.
                <br />
                Or explore a paid pilot.
              </h2>
              <p>
                See the documents behind one hypothetical onboarding decision, or compare the three
                proposed pilot scopes.
              </p>
            </div>
            <div className="public-next-actions">
              <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
                Follow the example mission <ArrowRight size={15} />
              </Link>
              <Link to="/pricing" className="dxl-link">
                Compare Pricing & Pilot <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
