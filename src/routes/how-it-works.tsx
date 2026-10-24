import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { MissionSampleRecord } from "@/components/marketing/mission-sample-record";
import { MissionDecisionExample } from "@/components/marketing/mission-decision-example";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "How DeliverX works — From question to informed action",
      "Explore the visual product journey: a mission, shared evidence, specialist handoffs, your decision, safeguards and an outcome review.",
    ),
  component: ExampleMission,
});

const CHAPTERS = [
  { id: "walkthrough", name: "Frame the mission", output: "A bounded question" },
  { id: "sample-record", name: "Connect the context", output: "A traceable product record" },
  {
    id: "specialist-handoffs",
    name: "Develop the direction",
    output: "Options and review findings",
  },
  { id: "safeguards", name: "Choose the next step", output: "Your scoped decision" },
  { id: "outcome-review", name: "Bring learning back", output: "Evidence for the next question" },
];

function ExampleMission() {
  return (
    <MarketingLayout>
      <div className="mission-redesign">
        <section className="mission-opening">
          <div className="dxl-wrap mission-opening-grid">
            <div>
              <p className="dxl-eyebrow">How DeliverX works</p>
              <h1>
                From a product question
                <br />
                to an informed next step.
              </h1>
              <p className="mission-opening-copy">
                One shared product record. Specialist contributions that build on each other. You
                decide which direction becomes work.
              </p>
              <div className="psi-actions">
                <a href="#walkthrough" className="dxl-btn dxl-btn-primary">
                  Follow the visual journey
                </a>
                <a href="#sample-documents" className="dxl-btn dxl-btn-ghost">
                  Inspect the sample pack
                </a>
              </div>
            </div>
            <div className="mission-brief-object">
              <span className="mission-brief-label">Our example mission</span>
              <h2>Which onboarding change should we investigate first?</h2>
              <div className="mission-brief-context">
                <span>Starting context</span>
                <p>Setup asks for several details before the first useful action.</p>
              </div>
              <div className="mission-brief-context">
                <span>Open question</span>
                <p>Where people leave, and why, is unknown.</p>
              </div>
              <div className="mission-brief-footer">
                <span>Hypothetical example</span>
                <span>Owner decision pending</span>
              </div>
            </div>
          </div>
          <div className="dxl-wrap">
            <p className="mission-example-label">
              Interactive concepts and hypothetical documents. No customer research, live agent
              execution or real approval takes place on this page.
            </p>
          </div>
        </section>
        <nav className="mission-chapter-nav" aria-label="Visual journey chapters">
          <div className="dxl-wrap">
            {CHAPTERS.map((chapter, index) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                <span>0{index + 1}</span>
                {chapter.name}
              </a>
            ))}
          </div>
        </nav>
        <section className="mission-chapter" id="walkthrough">
          <div className="dxl-wrap">
            <ChapterHeading
              index={0}
              title="Start with the question. See the whole journey."
              description="A mission carries the question through evidence, alternatives and review. Inspect the labelled stations to see what each receives and passes forward."
            />
            <SectionExplorer kind="mission" />
            <Handoff
              from="You supply"
              input="Question, constraints and authorised context"
              to="The mission holds"
              output="A bounded objective with visible evidence gaps"
            />
          </div>
        </section>
        <section className="mission-chapter" id="sample-record">
          <div className="dxl-wrap">
            <ChapterHeading
              index={1}
              title="Keep the evidence beside the decision."
              description="Product Brain is the shared context for the work. Sources, decisions, artefacts and observations stay connected; assumptions remain distinguishable from findings."
            />
            <SectionExplorer kind="record" />
            <Handoff
              from="Research Synthesis"
              input="Your brief, genuine notes and source links"
              to="Product record"
              output="Evidence references that travel with the recommendation"
            />
            <div className="mission-document-shelf" id="sample-documents">
              <div className="mission-record-section-heading">
                <div>
                  <p className="dxl-eyebrow">Inside the mission pack</p>
                  <h3>
                    Follow the evidence.
                    <br />
                    Inspect the decision.
                  </h3>
                </div>
                <p>
                  Open a document or follow a record reference. Sources, assumptions, objections and
                  missing inputs stay visible together.
                </p>
              </div>
              <MissionSampleRecord />
            </div>
          </div>
        </section>
        <section className="mission-chapter" id="specialist-handoffs">
          <div className="dxl-wrap">
            <ChapterHeading
              index={2}
              title="Specialists contribute. The reasoning moves with them."
              description="Research informs strategy. Design and engineering shape a proposal. Review disciplines challenge it before it reaches you. This is the conceptual collaboration model, not a claim that every role executes today."
            />
            <SectionExplorer kind="team" />
            <Handoff
              from="Specialist contributions"
              input="Evidence brief, constraints and alternatives"
              to="Your review"
              output="A recommendation with objections and unresolved questions"
            />
          </div>
        </section>
        <section className="mission-chapter" id="safeguards">
          <div className="dxl-wrap">
            <ChapterHeading
              index={3}
              title="A recommendation is not permission to act."
              description="Inspect the permission scope, usage ceiling and human authority before consequential work. Every decision needs a clear scope; a local download is not an external-action gate."
            />
            <SectionExplorer kind="trust" />
            <div className="mission-decision-divider" id="your-decision">
              <div>
                <p className="dxl-eyebrow">Try the owner’s decision</p>
                <h3>
                  What would you do
                  <br />
                  with this recommendation?
                </h3>
              </div>
              <p>
                The onboarding example has a missing baseline and an unresolved cause. Explore a
                response and inspect the next handoff. Your choice stays on this page.
              </p>
            </div>
            <MissionDecisionExample />
          </div>
        </section>
        <section className="mission-chapter" id="outcome-review">
          <div className="dxl-wrap">
            <ChapterHeading
              index={4}
              title="Bring back what happened. Improve the next question."
              description="An experiment plan is a hypothesis. You supply an actual observation; the review compares it with the expectation and preserves limitations. A proposed follow-up waits for your approval."
            />
            <SectionExplorer kind="learning" />
            <div className="mission-observation-strip">
              <div>
                <span>Expected measure</span>
                <strong>Setup completion</strong>
                <p>Time to first useful action; later profile completion as a guardrail.</p>
              </div>
              <div>
                <span>Current example</span>
                <strong>Result not observed</strong>
                <p>Baseline and observation window have not been supplied.</p>
              </div>
              <div>
                <span>Next handoff</span>
                <strong>Owner-reviewed follow-up</strong>
                <p>An approved next question returns to Evidence & memory.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mission-conversion">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Your product, your next question</p>
              <h2>
                Bring the context you have.
                <br />
                Start with the decision ahead.
              </h2>
              <p>
                Prepare a brief for your audience, objective and constraints. Missing evidence can
                be the first thing to investigate.
              </p>
            </div>
            <div className="psi-actions">
              <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
                Prepare your brief
              </Link>
              <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
                Explore paid pilots
              </Link>
              <Link to="/psi" className="dxl-link">
                View capabilities and limitations
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}

function ChapterHeading({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const chapter = CHAPTERS[index]!;
  return (
    <div className="mission-chapter-heading">
      <div className="mission-chapter-index">0{index + 1}</div>
      <div>
        <p className="dxl-eyebrow">{chapter.name}</p>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}
function Handoff({
  from,
  input,
  to,
  output,
}: {
  from: string;
  input: string;
  to: string;
  output: string;
}) {
  return (
    <div className="mission-handoff">
      <div>
        <span>{from}</span>
        <p>{input}</p>
      </div>
      <span className="mission-handoff-arrow" aria-label="passes forward">
        →
      </span>
      <div>
        <span>{to}</span>
        <p>{output}</p>
      </div>
    </div>
  );
}
