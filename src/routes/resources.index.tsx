import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/resources/")({
  head: () =>
    pageHead(
      "/resources",
      "Resources — DeliverX",
      "Guides for product builders and short explainers on how DeliverX decides, evidences and delivers.",
    ),
  component: ResourcesPage,
});

const GUIDES = [
  {
    title: "How to build a portfolio employers can evaluate",
    text: "Show problems framed, decisions taken and artefacts produced.",
    to: "/resources/pm-portfolio",
  },
  {
    title: "STAR stories grounded in real work",
    text: "Tie every Situation, Task, Action and Result to something real.",
    to: "/resources/star-interview-stories",
  },
] as const;

const EXPLAINERS = [
  {
    title: "How a decision gets made",
    text: "Independent positions, a red team, hard vetoes and a 60% weighted threshold — or your call.",
  },
  {
    title: "Synthetic vs real customer evidence",
    text: "Agents rehearse with labelled personas. Only interviews you add count as evidence.",
  },
  {
    title: "What's in your download",
    text: "Business case to audit trail, plus a manifest of what was simulated and what was real.",
  },
] as const;

function ResourcesPage() {
  return (
    <MarketingLayout>
      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Resources</p>
          <h1 className="dxl-h1">
            Build better products,
            <br />
            <span className="dxl-grad">with less guesswork.</span>
          </h1>
        </div>
      </section>
      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap">
          <header className="dxl-head">
            <h2 className="dxl-h2">Guides</h2>
          </header>
          <ul className="dxl-cards">
            {GUIDES.map((g) => (
              <li key={g.to}>
                <Link to={g.to}>
                  <strong>{g.title}</strong>
                  <span>{g.text}</span>
                  <em>
                    Read guide <ArrowRight className="size-4" />
                  </em>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="dxl-section">
        <div className="dxl-wrap">
          <header className="dxl-head">
            <h2 className="dxl-h2">How DeliverX works, briefly</h2>
          </header>
          <ul className="dxl-trust dxl-trust-3">
            {EXPLAINERS.map((e) => (
              <li key={e.title}>
                <strong>{e.title}</strong>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
          <p style={{ textAlign: "center", marginTop: 28 }}>
            <Link to="/how-it-works" className="dxl-link">
              See it in motion <ArrowRight className="size-4" />
            </Link>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
