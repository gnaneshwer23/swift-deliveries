import { JudgementFlow } from "@/components/marketing/judgement-flow";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Search, UserRoundCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CtaLink } from "@/components/marketing/cta-link";
import { pageHead } from "@/components/marketing/page-head";
import { ProductIllustration } from "@/components/marketing/product-illustration";
import { MissionWalkthrough } from "@/components/marketing/mission-walkthrough";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "How it works — Follow a product mission | DeliverX",
      "Follow one onboarding problem through evidence, alternatives, human approval and a reviewable product prototype. See what you bring, what the AI team does and what you decide.",
    ),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">How it works · a worked example</p>
            <h1 className="dxl-h1">
              One product problem.
              <br />
              <span className="dxl-grad">Follow every decision.</span>
            </h1>
            <p className="psi-lead">
              What happens after you bring an idea? Follow an onboarding-improvement mission from
              the first question to work you can inspect.
            </p>
            <div className="psi-actions">
              <a href="#walkthrough" className="dxl-btn dxl-btn-primary">
                Walk through the mission <ArrowRight size={16} />
              </a>
              <Link to="/resources" hash="brief-builder" className="psi-text-button">
                Write your own brief
              </Link>
            </div>
          </div>
          <ProductIllustration
            name="evidence-decision"
            priority
            caption="A visual explanation of the process—not a screenshot of a live mission."
          />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <div className="psi-section-heading">
            <p className="dxl-eyebrow">The example</p>
            <h2 className="dxl-h2">“Why do people leave during setup?”</h2>
            <p>Start with a question. Bring what you know. Keep the assumptions visible.</p>
          </div>
          <JudgementFlow />
          <MissionWalkthrough />
        </div>
      </section>
      <section className="psi-section" id="workforce">
        <div className="dxl-wrap psi-split">
          <ProductIllustration name="specialist-team" />
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">A team with a purpose</p>
            <h2 className="dxl-h2">
              The right disciplines.
              <br />A shared brief.
            </h2>
            <p>
              Research examines the sources. Product compares the options. Design makes the journey
              tangible. Reviewers challenge the output. Each contribution has a job and a place in
              the record.
            </p>
            <p>
              The 150-role catalogue describes the wider workforce. Missions use enabled
              capabilities; it does not mean 150 agents run on every request.
            </p>
            <div className="psi-role-tags">
              <span>Research</span>
              <span>Product</span>
              <span>Design</span>
              <span>Engineering</span>
              <span>Review</span>
            </div>
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">Your part in the process</p>
            <h2 className="dxl-h2">
              Delegate the work.
              <br />
              Keep the judgement.
            </h2>
            <p>
              A useful AI team makes it easier to decide. It should surface uncertainty, pause for
              consequential calls and let you send work back.
            </p>
            <ul className="psi-icon-list">
              <li>
                <FileText size={20} />
                <div>
                  <strong>Set the objective</strong>
                  <span>Name the audience, outcome and constraints.</span>
                </div>
              </li>
              <li>
                <Search size={20} />
                <div>
                  <strong>Inspect the evidence</strong>
                  <span>Ask what is supported, inferred or still unknown.</span>
                </div>
              </li>
              <li>
                <UserRoundCheck size={20} />
                <div>
                  <strong>Approve the direction</strong>
                  <span>Accept, change or reject the recommendation.</span>
                </div>
              </li>
            </ul>
          </div>
          <ProductIllustration name="human-direction" />
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <ProductIllustration name="product-delivery" />
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">Know what you are receiving</p>
            <h2 className="dxl-h2">
              A prototype is a prototype.
              <br />A test needs evidence.
            </h2>
            <p>
              Current programmes produce documents, decision records, a lightweight HTML prototype
              and an export. Generation mode is disclosed. Static checks do not mean the application
              ran, and a release plan does not mean it was deployed.
            </p>
            <Link to="/resources" className="dxl-link">
              Get the review templates <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">The next loop</p>
            <h2 className="dxl-h2">
              The result should inform
              <br />
              the next question.
            </h2>
            <p>
              Connected outcome review is the next PSI capability. For now, use the experiment brief
              to record the expected result, then add what you actually observe. Learning begins
              with an honest comparison.
            </p>
            <Link to="/resources" hash="templates" className="dxl-link">
              Download the experiment brief <ArrowRight size={16} />
            </Link>
          </div>
          <ProductIllustration name="learning-loop" />
        </div>
      </section>
      <section className="psi-closing dxl-wrap">
        <p className="dxl-eyebrow">Your turn</p>
        <h2 className="dxl-h2">
          Bring the question
          <br />
          your product needs answered.
        </h2>
        <CtaLink
          signedInTo="/command/programmes"
          signedInLabel="Open my product workspace"
          signedOutLabel="Start with your idea"
          className="dxl-btn dxl-btn-primary"
        />
      </section>
    </MarketingLayout>
  );
}
