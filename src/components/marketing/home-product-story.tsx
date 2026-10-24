import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, GitBranch, FlaskConical } from "lucide-react";
import { ContextContinuity, ImpactExplorer } from "./context-and-impact";
import { SectionExplorer } from "./section-explorer";

const STORY = [
  { id: "home-context", label: "Context" },
  { id: "home-specialists", label: "Specialists" },
  { id: "home-lifecycle", label: "Lifecycle" },
  { id: "home-mission", label: "Example mission" },
  { id: "home-learning", label: "Learning" },
  { id: "home-trust", label: "Your control" },
];

export function HomeProductStory() {
  return (
    <div className="home-product-story">
      <section className="home-story-problem" id="home-problem">
        <div className="dxl-wrap">
          <StoryHeading
            number="01"
            label="The problem"
            title="Every handoff can lose the reason."
            description="Research becomes a brief. A brief becomes a decision. A decision becomes work. When the source and the rationale disappear, the next person has to guess."
          />
          <ContextContinuity />
          <div className="home-story-takeaway">
            <span>The shift</span>
            <p>Keep the evidence, the decision and the work in the same product record.</p>
            <a href="#home-context">
              See how the context connects <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <nav className="home-story-navigation" aria-label="Explore the product story">
        <div className="dxl-wrap">
          <span>Explore DeliverX</span>
          {STORY.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
      <section className="home-story-section" id="home-context">
        <div className="dxl-wrap">
          <StoryHeading
            number="02"
            label="Product Brain · Evidence & memory"
            title="One product record. The reasoning stays attached."
            description="Connect supplied sources to decisions, artefacts and observations. Keep what is known separate from what is inferred or still missing."
          />
          <SectionExplorer kind="record" />
          <StoryFooter
            input="Supplied sources and product constraints"
            output="Context for the next decision"
            to="/psi"
            hash="product-brain"
            link="Explore Product Brain"
          />
        </div>
      </section>
      <section className="home-story-section" id="home-specialists">
        <div className="dxl-wrap">
          <StoryHeading
            number="03"
            label="Specialist contributions · Judgement"
            title="Different disciplines. One connected question."
            description="Research informs strategy. Design and engineering shape a direction. Review disciplines challenge it before you decide. Inspect the contribution at each handoff."
          />
          <div className="home-workforce-caption">
            <strong>150 catalogue roles</strong>
            <span>15 departments</span>
            <span>
              Only enabled capabilities can run. A role listing is not proof of live execution.
            </span>
          </div>
          <SectionExplorer kind="team" />
          <StoryFooter
            input="Evidence, constraints and alternatives"
            output="A recommendation with objections preserved"
            to="/ai-agents"
            link="Inspect the specialist directory"
          />
        </div>
      </section>
      <section className="home-story-section home-story-lifecycle" id="home-lifecycle">
        <div className="dxl-wrap">
          <StoryHeading
            number="04"
            label="From idea to impact"
            title="See the whole lifecycle. Start with a bounded step."
            description="Explore how discovery, design, delivery and review connect. The broader lifecycle is the product direction; the current pilot begins with an agreed mission scope."
          />
          <ImpactExplorer />
        </div>
      </section>
      <section className="home-story-section" id="home-mission">
        <div className="dxl-wrap">
          <StoryHeading
            number="05"
            label="A mission in action · Delivery"
            title="Which onboarding change should we investigate first?"
            description="Follow one hypothetical question from evidence to options, review and your decision. No abandonment data or observed improvement is invented for the example."
          />
          <SectionExplorer kind="mission" />
          <div className="home-mission-records">
            <div>
              <span>What you can inspect</span>
              <h3>A record behind the recommendation.</h3>
            </div>
            <div className="home-mission-documents">
              {[
                {
                  name: "Evidence register",
                  detail: "Sources, inferences and open gaps",
                  icon: FileText,
                },
                {
                  name: "Decision record",
                  detail: "Options, objection and pending owner decision",
                  icon: GitBranch,
                },
                {
                  name: "Experiment brief",
                  detail: "Hypothesis and measurement plan; no result",
                  icon: FlaskConical,
                },
              ].map((item) => (
                <Link to="/how-it-works" hash="sample-documents" key={item.name}>
                  <item.icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="home-story-section" id="home-learning">
        <div className="dxl-wrap">
          <StoryHeading
            number="06"
            label="Continuous learning · Feedback loop"
            title="Bring back the result. Keep the uncertainty."
            description="An owner-supplied observation can inform a versioned review and a proposed next question. Missing results remain missing. Follow-up work waits for your approval."
          />
          <SectionExplorer kind="learning" />
          <StoryFooter
            input="Expected measure and a genuine observation"
            output="Review findings and a proposed next mission"
            to="/how-it-works"
            hash="outcome-review"
            link="Follow the feedback loop"
          />
        </div>
      </section>
      <section className="home-story-section" id="home-trust">
        <div className="dxl-wrap">
          <StoryHeading
            number="07"
            label="Trust & governance"
            title="You decide what becomes action."
            description="Scope, permissions, usage ceilings and human authority belong in the workflow. A recommendation is a proposal; consequential work needs an explicit decision."
          />
          <SectionExplorer kind="trust" />
          <StoryFooter
            input="Proposed action, scope and risks"
            output="Your decision and a reviewable record"
            to="/security"
            link="Inspect the safeguards"
          />
        </div>
      </section>
      <section className="home-story-close">
        <div className="dxl-wrap home-story-close-grid">
          <div>
            <p className="dxl-eyebrow">Start with your product</p>
            <h2>
              Bring one question.
              <br />
              Build the next step with purpose.
            </h2>
            <p>
              Prepare a brief with your audience, objective and available evidence, or explore a
              scoped paid pilot.
            </p>
            <div className="psi-actions">
              <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
                Prepare your brief
              </Link>
              <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
                Compare paid pilots
              </Link>
            </div>
            <p className="home-story-close-note">
              Creating an account does not activate a paid pilot. Scope and billing are agreed
              before work starts.
            </p>
          </div>
          <figure>
            <img
              src="/illustrations/role-builder.webp"
              width={1152}
              height={864}
              alt="Product building blocks assembled inside a frame beside an interface."
              loading="lazy"
            />
            <figcaption>Your objective → scoped mission → inspectable work</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
function StoryHeading({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="home-story-heading">
      <span className="home-story-number">{number}</span>
      <div>
        <p className="dxl-eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}
function StoryFooter({
  input,
  output,
  to,
  hash,
  link,
}: {
  input: string;
  output: string;
  to: "/psi" | "/ai-agents" | "/how-it-works" | "/security";
  hash?: string;
  link: string;
}) {
  return (
    <div className="home-story-handoff">
      <div>
        <span>Receives</span>
        <p>{input}</p>
      </div>
      <ArrowRight size={20} aria-hidden="true" />
      <div>
        <span>Passes forward</span>
        <p>{output}</p>
      </div>
      <Link to={to} {...(hash ? { hash } : {})} className="dxl-link">
        {link}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
