import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { SpecialistDirectory } from "@/components/marketing/specialist-directory";
import {
  WORKFORCE_AVAILABLE_IDS,
  WORKFORCE_DEPARTMENTS,
  WORKFORCE_TOTAL,
} from "@/lib/marketing/workforce-summary";

export const Route = createFileRoute("/ai-agents")({
  head: () =>
    pageHead(
      "/ai-agents",
      "AI specialists — Meet the team | DeliverX",
      "Browse 150 specialist roles across 15 departments: what each one does, which missions it joins, and which are available today.",
    ),
  component: Agents,
});

function Agents() {
  const available = WORKFORCE_AVAILABLE_IDS.length;
  return (
    <MarketingLayout>
      <div className="sdp">
        <section className="sdp-hero">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">Specialists</p>
            <h1>
              Meet the team that
              <br />
              <span className="dxl-grad">forms around your product.</span>
            </h1>
            <p>
              One clear job and a limit on what it may do. Without a configured model, specialists
              produce clearly labelled simulated drafts.
            </p>
            <dl className="sdp-stats">
              <div>
                <dt>Specialist roles</dt>
                <dd>{WORKFORCE_TOTAL}</dd>
              </div>
              <div>
                <dt>Departments</dt>
                <dd>{WORKFORCE_DEPARTMENTS.length}</dd>
              </div>
              <div data-live="">
                <dt>Can be assigned today</dt>
                <dd>{available}</dd>
              </div>
              <div>
                <dt>In development</dt>
                <dd>{WORKFORCE_TOTAL - available}</dd>
              </div>
            </dl>
          </div>
        </section>
        <section className="sdp-directory">
          <div className="dxl-wrap">
            <SpecialistDirectory />
          </div>
        </section>
        <section className="sdp-close">
          <div className="dxl-wrap">
            <h2>You don’t pick the team. You approve it.</h2>
            <p>
              Describe your product and DeliverX proposes the specialists, the tasks and the cost.
              You see who is on the mission before anything runs.
            </p>
            <div className="psi-actions">
              <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
                Start building <ArrowRight size={16} />
              </Link>
              <Link to="/how-it-works" className="dxl-btn dxl-btn-ghost">
                See a mission run
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
