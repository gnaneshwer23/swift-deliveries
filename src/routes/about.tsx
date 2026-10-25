import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { WORKFORCE_AVAILABLE_IDS, WORKFORCE_TOTAL } from "@/lib/marketing/workforce-summary";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "/about",
      "About — An AI product company | DeliverX",
      "Why DeliverX exists, what we commit to, and where the product is today.",
    ),
  component: About,
});

const COMMITMENTS = [
  {
    title: "We say what works today.",
    body: "Every capability is marked live, opt-in or planned. A role in the catalogue is not presented as a working agent until it passes its checks.",
  },
  {
    title: "Your work leaves with you.",
    body: "Briefs, decisions, prototypes and their history export as files you own, with a manifest of anything that was simulated.",
  },
  {
    title: "Judgement can be learned.",
    body: "Students and new builders use the same product, with the same evidence standards. Learning does not lower the bar.",
  },
  {
    title: "No invented evidence.",
    body: "We never fabricate customers, interviews or results. Rehearsal interviews are labelled; only what you supply counts.",
  },
];

function About() {
  const available = WORKFORCE_AVAILABLE_IDS.length;
  return (
    <MarketingLayout>
      <div className="abt">
        <section className="abt-hero">
          <div className="dxl-wrap">
            <p className="dxl-eyebrow">About DeliverX</p>
            <h1>
              Good ideas deserve
              <br />
              <span className="dxl-grad">a whole product team.</span>
            </h1>
            <p>
              Most ideas never get research, design, engineering and review working together. We are
              building a team of AI specialists that can, with the person who had the idea in charge
              of every decision that matters.
            </p>
          </div>
        </section>

        <section className="abt-section">
          <div className="dxl-wrap">
            <div className="abt-heading">
              <h2>What we commit to.</h2>
              <p>Four promises that shape every page and every feature.</p>
            </div>
            <ol className="abt-commitments">
              {COMMITMENTS.map((c, i) => (
                <li key={c.title}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="abt-section">
          <div className="dxl-wrap">
            <div className="abt-heading">
              <h2>Where we are today.</h2>
              <p>An early product, built in the open with the people who use it.</p>
            </div>
            <dl className="abt-facts">
              <div>
                <dt>Specialists available now</dt>
                <dd>
                  {available} <small>of {WORKFORCE_TOTAL}</small>
                </dd>
              </div>
              <div>
                <dt>Missions you can run</dt>
                <dd>Investigate, prototype, improve</dd>
              </div>
              <div>
                <dt>How to start</dt>
                <dd>Free account or a scoped paid pilot</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="abt-section">
          <div className="dxl-wrap abt-founder">
            <div>
              <p className="dxl-eyebrow">Who builds it</p>
              <h2>Built independently by its founder.</h2>
            </div>
            <div>
              <p>
                DeliverX is built and run by Gnaneshwer Jadav. Questions, feedback or a product you
                would like to build together:{" "}
                <a href="mailto:gnaneshwer.jadav@gmail.com">get in touch</a>.
              </p>
              <p className="abt-fine">
                A registered company entity is being established. Current service details are in our{" "}
                <Link to="/terms">terms</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="abt-close">
          <div className="dxl-wrap">
            <h2>Bring us an idea.</h2>
            <div className="psi-actions">
              <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
                Start building <ArrowRight size={16} />
              </Link>
              <Link to="/how-it-works" className="dxl-btn dxl-btn-ghost">
                See how it works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
