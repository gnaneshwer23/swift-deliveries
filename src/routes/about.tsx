import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "/about",
      "About — DeliverX",
      "DeliverX turns ideas into products with a governed AI workforce — and keeps the founder in charge.",
    ),
  component: About,
});

const PRINCIPLES = [
  { title: "You decide", text: "AI proposes and debates. Consequential calls are yours." },
  {
    title: "Show the evidence",
    text: "Sources, dissent and simulations are visible, never hidden.",
  },
  { title: "Own your work", text: "Everything we produce for you is yours to download." },
];

function About() {
  return (
    <MarketingLayout>
      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">About</p>
          <h1 className="dxl-h1">
            A product company,
            <br />
            <span className="dxl-grad">for anyone with an idea.</span>
          </h1>
          <p className="dxl-lead">
            Great products need researchers, strategists, designers, engineers and reviewers.
            DeliverX brings those disciplines together around your product. Founders, product teams
            and students can build with the team and learn through the work.
          </p>
        </div>
      </section>
      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap">
          <ul className="dxl-trust dxl-trust-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
          <p className="dxl-footnote" style={{ textAlign: "center", marginTop: 32 }}>
            DeliverX is an independent product built and run by its founder, reachable at{" "}
            <a href="mailto:gnaneshwer.jadav@gmail.com">gnaneshwer.jadav@gmail.com</a>. A registered
            company entity is being established.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
