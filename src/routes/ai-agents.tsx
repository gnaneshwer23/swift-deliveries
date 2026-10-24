import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { SpecialistWorkforce } from "@/components/marketing/specialist-workforce";
import { WiderCatalogue } from "@/components/marketing/wider-catalogue";
import { capabilityRegistryData as registry } from "@/lib/workforce/registry/data";
export const Route = createFileRoute("/ai-agents")({
  head: () =>
    pageHead(
      "/ai-agents",
      "Specialist workforce — Six working roles and the wider catalogue | DeliverX",
      "Follow six specialists from evidence to a held export. The wider catalogue is not 150 live working agents.",
    ),
  component: Agents,
});
function Agents() {
  const foundationCount = registry.capabilities.filter(
    (c) => c.lifecycle_status === "available",
  ).length;
  const plannedCount = registry.capabilities.filter((c) => c.lifecycle_status === "planned").length;
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Specialist workforce · capability directory</p>
          <h1 className="dxl-h1">
            Specialists with
            <br />
            <span className="dxl-grad">a defined contribution.</span>
          </h1>
          <p className="psi-lead">
            Six roles finish a task, record why, attach evidence, and hand the artefact on. You
            approve the export. A specialist does not approve that step.
          </p>
          <p className="journey-status">
            The wider catalogue lists {registry.capabilities.length} roles. {foundationCount} are
            available as role foundations with deterministic-stub limitations, and {plannedCount}{" "}
            are planned. This is not {registry.capabilities.length} live working agents.
          </p>
          <SpecialistWorkforce />
        </div>
      </section>
      <WiderCatalogue />
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">See a contribution in context.</h2>
          <p>
            A catalogue is useful when you can see what moves from one role to the next. Follow the
            onboarding example and inspect its hypothetical outputs.
          </p>
          <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
            Explore the example mission
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
