import { Link } from "@tanstack/react-router";
import { MarketingLayout } from "./marketing-layout";
import { ProductIllustration, type IllustrationName } from "./product-illustration";
import { JudgementFlow } from "./judgement-flow";
type Section = { title: string; body: string; art: IllustrationName; steps: string[] };
export function PlatformPage({
  eyebrow,
  title,
  lead,
  sections,
  flow = false,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: Section[];
  flow?: boolean;
}) {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">{eyebrow}</p>
          <h1 className="dxl-h1">{title}</h1>
          <p className="psi-lead">{lead}</p>
          <div className="psi-actions">
            <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
              View example mission
            </Link>
            <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
              Explore paid pilots
            </Link>
          </div>
        </div>
      </section>
      {sections.map((s, i) => (
        <section key={s.title} className={`psi-section ${i % 2 === 0 ? "psi-tinted" : ""}`}>
          <div className="dxl-wrap psi-split">
            <div className="psi-section-copy">
              <p className="dxl-eyebrow">
                0{i + 1} · {eyebrow}
              </p>
              <h2 className="dxl-h2">{s.title}</h2>
              <p>{s.body}</p>
              <ol className="psi-check-list">
                {s.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <ProductIllustration name={s.art} />
          </div>
        </section>
      ))}
      {flow && (
        <div className="dxl-wrap">
          <JudgementFlow />
        </div>
      )}
    </MarketingLayout>
  );
}
