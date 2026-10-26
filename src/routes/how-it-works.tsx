import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleDashed, CircleCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { MissionSampleRecord } from "@/components/marketing/mission-sample-record";
import { MissionWalkthroughLive } from "@/components/marketing/mission-walkthrough-live";
import { pageHead } from "@/components/marketing/page-head";
import { WORKFORCE_AVAILABLE_IDS, WORKFORCE_TOTAL } from "@/lib/marketing/workforce-summary";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "How DeliverX works — From one sentence to a result you can inspect",
      "Follow a sample mission: describe it, answer what the planner needs, review the plan and its cost, approve it, watch the work move and receive results that say how they were made.",
    ),
  component: HowItWorks,
});

const LIVE = [
  "Investigate, Prototype and Improve missions from one sentence",
  "Clarifying questions before a plan is drafted",
  "Plans with tasks, team, checks and usage estimate",
  "Your approval before anything runs",
  "Usage ceilings that stop billable steps",
  "Quality labels on every artefact, never a generic “verified”",
  "Exports that state what was simulated",
];
const NEXT = [
  "Live model mode for every specialist (opt-in today)",
  "Connected outcome tracking after release",
  "Retained runtime test logs for prototypes",
  "Approved preview deployments",
];

function HowItWorks() {
  return (
    <MarketingLayout>
      <div className="hiw">
        <section className="hiw-opening">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">How it works</p>
            <h1>
              From one sentence
              <br />
              <span className="dxl-grad">to a result you can inspect.</span>
            </h1>
            <p className="hiw-lede">
              This is what a mission looks like inside DeliverX. The plan, the team and the checks
              below are exactly what the planner produces for this request.
            </p>
          </div>
        </section>

        <section className="hiw-walkthrough" id="walkthrough">
          <div className="dxl-wrap">
            <MissionWalkthroughLive />
          </div>
        </section>

        <section className="hiw-section" id="sample-documents">
          <div className="dxl-wrap">
            <div className="hiw-heading">
              <div>
                <p className="dxl-eyebrow">What you receive</p>
                <h2>Documents you can check, not just read.</h2>
              </div>
              <p>
                Open the sample pack from a similar mission. Sources, assumptions, objections and
                missing inputs stay visible together. These are hypothetical sample documents.
              </p>
            </div>
            <MissionSampleRecord />
          </div>
        </section>

        <section className="hiw-section" id="outcome-review">
          <div className="dxl-wrap">
            <div className="hiw-heading">
              <div>
                <p className="dxl-eyebrow">Today and next</p>
                <h2>What runs now, and what is still coming.</h2>
              </div>
              <p>
                {WORKFORCE_AVAILABLE_IDS.length} of {WORKFORCE_TOTAL} specialists are available
                today. We list what is live and what is planned so you never have to guess.
              </p>
            </div>
            <div className="hiw-status">
              <div>
                <h3>Live today</h3>
                <ul>
                  {LIVE.map((item) => (
                    <li key={item}>
                      <CircleCheck size={17} aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div data-next="">
                <h3>Coming next</h3>
                <ul>
                  {NEXT.map((item) => (
                    <li key={item}>
                      <CircleDashed size={17} aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="hiw-close">
          <div className="dxl-wrap">
            <h2>Run your own in a few minutes.</h2>
            <p>Describe your product, review the plan, and approve only what you want to run.</p>
            <div className="psi-actions">
              <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
                Start building <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
                Compare pilots
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
