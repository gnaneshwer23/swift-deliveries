import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileSearch,
  GitBranch,
  FolderArchive,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PsiPlatformMap } from "@/components/marketing/psi-platform-map";
import { PsiAudienceExplorer } from "@/components/marketing/psi-audience-explorer";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/psi")({
  head: () =>
    pageHead(
      "/psi",
      "PSI Platform — Connected product intelligence | DeliverX",
      "Explore how DeliverX connects evidence, specialist judgement, reviewable delivery and feedback through one Product Brain, with human authority at every consequential step.",
    ),
  component: ProductPage,
});
function ProductPage() {
  return (
    <MarketingLayout>
      <div className="platform-page">
        <section className="platform-opening">
          <div className="dxl-wrap">
            <div className="platform-intro">
              <div>
                <p className="dxl-eyebrow">Product Super Intelligence</p>
                <h1>
                  One product context.
                  <br />
                  Connected intelligence.
                </h1>
              </div>
              <div>
                <p>
                  PSI connects the evidence behind a question, the specialists considering it and
                  the decision that moves it forward. Product Brain keeps the reasoning with the
                  work.
                </p>
                <div className="psi-actions">
                  <a href="#platform-architecture" className="dxl-btn dxl-btn-primary">
                    Explore the system
                  </a>
                  <Link to="/how-it-works" className="dxl-btn dxl-btn-ghost">
                    See a mission
                  </Link>
                </div>
              </div>
            </div>
            <div id="platform-architecture">
              <PsiPlatformMap />
            </div>
          </div>
        </section>
        <nav className="platform-page-nav" aria-label="Platform sections">
          <div className="dxl-wrap">
            <a href="#product-brain">Product Brain</a>
            <a href="#specialists">Specialists</a>
            <a href="#capabilities">Scope & availability</a>
            <a href="#who-its-for">Who it’s for</a>
            <a href="#controls">Human control</a>
            <a href="#learning">Learning</a>
          </div>
        </nav>
        <section className="platform-section" id="product-brain">
          <div className="dxl-wrap">
            <PlatformHeading
              label="The shared foundation"
              title="Trace the work back to the reason."
              description="The product record connects what you supplied, which alternatives were considered and why the owner chose a direction. A full interactive knowledge graph remains planned."
            />
            <div className="platform-record-chain">
              {[
                {
                  icon: FileSearch,
                  ref: "E-01 / E-02",
                  title: "Evidence",
                  text: "Source references, assertions, inferences and open gaps.",
                },
                {
                  icon: GitBranch,
                  ref: "D-01",
                  title: "Decision",
                  text: "Alternatives, reviewer objections and a scoped owner choice.",
                },
                {
                  icon: FolderArchive,
                  ref: "A-01",
                  title: "Artefact",
                  text: "An experiment brief linked to its decision and measurement plan.",
                },
              ].map((item, index) => (
                <div key={item.title}>
                  <item.icon aria-hidden="true" />
                  <span>{item.ref}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  {index < 2 && <ArrowRight className="platform-chain-arrow" aria-hidden="true" />}
                </div>
              ))}
            </div>
            <div className="platform-section-foot">
              <span>Illustrative record references, not customer evidence.</span>
              <Link to="/how-it-works" hash="sample-documents" className="dxl-link">
                Inspect the linked example
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <section className="platform-section platform-specialists" id="specialists">
          <div className="dxl-wrap platform-specialist-layout">
            <div>
              <p className="dxl-eyebrow">Bounded contributions</p>
              <h2>
                A specialist needs context.
                <br />
                The next role needs a handoff.
              </h2>
              <p>
                Roles describe product disciplines, not a promise of 150 autonomous agents. Each
                enabled capability has a bounded contribution; its output should explain what the
                next step can rely on.
              </p>
              <div className="platform-catalogue-count">
                <strong>
                  150 <span>catalogue roles</span>
                </strong>
                <strong>
                  15 <span>departments</span>
                </strong>
              </div>
              <Link to="/ai-agents" className="dxl-link">
                Inspect roles and capability status
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <figure className="platform-team-figure">
              <img
                src="/illustrations/specialist-workbench-v1.webp"
                width={1536}
                height={1024}
                alt="Conceptual specialist workbench connecting research, strategy, design, review and human approval."
                loading="lazy"
              />
              <figcaption>
                <span>Research</span>
                <ArrowRight size={14} aria-hidden="true" />
                <span>Options & review</span>
                <ArrowRight size={14} aria-hidden="true" />
                <span>Your decision</span>
              </figcaption>
              <p>Conceptual collaboration. Catalogue status does not certify live execution.</p>
            </figure>
          </div>
        </section>
        <section className="platform-section" id="capabilities">
          <div className="dxl-wrap">
            <PlatformHeading
              label="Scope & availability"
              title="Understand what the platform supports."
              description="A supervised mission starts with agreed scope and enabled capabilities. Workspace access, configuration and release checks must be confirmed for a paid pilot."
            />
            <div
              className="platform-capability-table"
              role="region"
              aria-label="Platform scope comparison"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Product area</th>
                    <th>Supervised workflow</th>
                    <th>Boundary</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Product record",
                      "Briefs, source references, options and decisions",
                      "A full interactive knowledge graph is planned.",
                    ],
                    [
                      "Specialist contributions",
                      "Enabled capabilities with disclosed model or simulated provenance",
                      "A catalogue role is not proof of execution or independent verification.",
                    ],
                    [
                      "Owner decisions",
                      "Scoped human decisions and reviewable history",
                      "This public page grants no approval or tool access.",
                    ],
                    [
                      "Reviewable delivery",
                      "Decision pack, experiment planning and portable documents",
                      "Prototypes need an agreed extension; automatic deployment is not promised.",
                    ],
                    [
                      "Outcome review",
                      "Owner-supplied observations, versioned review and proposed follow-up",
                      "Connected analytics collection remains planned; follow-up requires approval.",
                    ],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) =>
                        index === 0 ? (
                          <th scope="row" key={cell}>
                            {cell}
                          </th>
                        ) : (
                          <td key={cell}>{cell}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="platform-roadmap-note">
              <span>Future direction</span>
              <p>
                Broader design and engineering execution, verification, release and connected
                learning extend the lifecycle. Their availability is not implied by the
                illustrations.
              </p>
              <Link to="/" hash="home-lifecycle" className="dxl-link">
                Explore the lifecycle direction
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <section className="platform-section platform-audience-section" id="who-its-for">
          <div className="dxl-wrap">
            <PlatformHeading
              label="One environment, different starting points"
              title="Build a product. Learn through the work."
              description="Founders, product teams and students can bring different questions into the same evidence-to-decision workflow. These are example use cases, not customer outcome claims."
            />
            <PsiAudienceExplorer />
            <Link to="/solutions" className="dxl-link">
              Choose an editable starting brief <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="platform-section" id="controls">
          <div className="dxl-wrap platform-control-layout">
            <div>
              <p className="dxl-eyebrow">Human authority</p>
              <h2>
                Keep the consequential
                <br />
                decisions in your hands.
              </h2>
              <p>
                Review the evidence, scope and uncertainty before approving the next step. A
                specialist can prepare the case; it cannot pass a human lifecycle gate.
              </p>
              <Link to="/security" className="dxl-link">
                Explore the safeguards
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <ol className="platform-control-flow">
              {[
                {
                  title: "Define the scope",
                  text: "Name the intended action, target and constraints.",
                },
                {
                  title: "Inspect the case",
                  text: "Review the recommendation, dissent and evidence gaps.",
                },
                {
                  title: "Record your decision",
                  text: "Approve a bounded step, reject it or request more evidence.",
                },
              ].map((step, index) => (
                <li key={step.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
              <li className="platform-control-end">
                <ShieldCheck aria-hidden="true" />
                <p>Permissions and usage controls must be verified for the enabled workspace.</p>
              </li>
            </ol>
          </div>
        </section>
        <section className="platform-section platform-learning-section" id="learning">
          <div className="dxl-wrap">
            <PlatformHeading
              label="Feedback loop"
              title="Carry the observation into the next decision."
              description="Compare the expected metric with a result you actually observed. The review keeps limitations visible and may propose the next question; you decide whether it becomes work."
            />
            <div className="platform-feedback-loop">
              <div>
                <span>Expected</span>
                <h3>Hypothesis & measure</h3>
                <p>Baseline, metric and observation window.</p>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>Observed</span>
                <h3>You supply the result</h3>
                <p>Genuine evidence with its source and limits.</p>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>Reviewed</span>
                <h3>A proposed next question</h3>
                <p>Owner approval before a follow-up mission.</p>
              </div>
            </div>
            <p className="platform-feedback-return">
              <RefreshCw size={16} aria-hidden="true" />
              The approved next question returns to Evidence & memory.
            </p>
            <Link to="/how-it-works" hash="outcome-review" className="dxl-link">
              See the example feedback loop
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="platform-next-step" aria-labelledby="platform-next-title">
          <div className="dxl-wrap">
            <div className="platform-next-intro">
              <p className="dxl-eyebrow">Your next product decision</p>
              <h2 id="platform-next-title">
                A clear question.
                <br />A useful next step.
              </h2>
              <p>Start with the context you have. Choose the path that fits where you are.</p>
            </div>
            <div className="platform-next-paths">
              <Link to="/resources" hash="brief-builder">
                <span>Shape the question</span>
                <h3>
                  Prepare your brief
                  <ArrowRight size={19} aria-hidden="true" />
                </h3>
                <p>
                  Capture your audience, objective and constraints. Download the brief before
                  committing to a pilot.
                </p>
              </Link>
              <Link to="/pricing">
                <span>Discuss the scope</span>
                <h3>
                  Compare paid pilots
                  <ArrowRight size={19} aria-hidden="true" />
                </h3>
                <p>
                  Explore Builder, Founder and Studio. Scope, availability and billing are agreed
                  before paid work starts.
                </p>
              </Link>
              <small>Creating an account does not activate a paid pilot.</small>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
function PlatformHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="platform-section-heading">
      <div>
        <p className="dxl-eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}
