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
    title: "Turn an idea into a useful product brief",
    text: "Name the problem, the people it affects, the outcome and the constraints before your team starts.",
    to: "/how-it-works",
    cta: "Explore the workflow",
  },
  {
    title: "Learn by building with an AI team",
    text: "Start a small product, inspect the evidence and practise decisions at each approval gate.",
    to: "/signup",
    cta: "Start a learning project",
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
            <h2 className="dxl-h2">Starting points</h2>
          </header>
          <ul className="dxl-cards">
            {GUIDES.map((g) => (
              <li key={g.to}>
                <Link
                  to={g.to}
                  search={g.to === "/signup" ? { redirect: "/command/programmes" } : {}}
                >
                  <strong>{g.title}</strong>
                  <span>{g.text}</span>
                  <em>
                    {g.cta} <ArrowRight className="size-4" />
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
