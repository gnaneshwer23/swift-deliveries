import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { BRIEF_PRESETS, type BriefPreset } from "@/lib/marketing/brief-presets";
export const Route = createFileRoute("/solutions")({
  head: () =>
    pageHead(
      "/solutions",
      "Use cases — Find your first product question | DeliverX",
      "Choose a starting brief for founder validation, product improvement or learning by building. Inspect the input, work and proposed output for each.",
    ),
  component: UseCases,
});
function UseCases() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Use cases</p>
          <h1 className="dxl-h1">
            Start with the question
            <br />
            in front of you.
          </h1>
          <p className="psi-lead">
            Validate an idea, improve a product or learn through the work. Each starting point opens
            an editable brief with its own question and boundaries.
          </p>
          <p className="journey-status">
            Illustrative starting points, not customer success stories. Pilot delivery scope and
            capability availability must be agreed before work starts.
          </p>
        </div>
      </section>
      {(Object.keys(BRIEF_PRESETS) as BriefPreset[]).map((key, index) => {
        const item = BRIEF_PRESETS[key];
        return (
          <section key={key} className={`psi-section ${index % 2 === 0 ? "psi-tinted" : ""}`}>
            <div className="dxl-wrap">
              <p className="dxl-eyebrow">{item.audience}</p>
              <h2 className="dxl-h2">{item.label}</h2>
              <p className="psi-lead">“{item.question}”</p>
              <ol className="use-case-flow" aria-label={`${item.label}: input to output`}>
                <li>
                  <span>You bring</span>
                  <strong>{item.input}</strong>
                </li>
                <li>
                  <span>The work</span>
                  <strong>{item.work}</strong>
                </li>
                <li>
                  <span>Proposed output</span>
                  <strong>{item.output}</strong>
                </li>
              </ol>
              <div className="psi-actions">
                <Link
                  to="/resources"
                  search={{ useCase: key }}
                  hash="brief-builder"
                  className="dxl-btn dxl-btn-primary"
                >
                  Prepare this brief
                </Link>
                {key === "team" ? (
                  <Link to="/how-it-works" className="dxl-link">
                    Inspect the onboarding example
                  </Link>
                ) : (
                  <Link to="/pricing" className="dxl-link">
                    Compare pilot offers
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </MarketingLayout>
  );
}
