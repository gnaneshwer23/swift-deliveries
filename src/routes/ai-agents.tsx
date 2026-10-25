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
      "AI specialists — Roles and contributions | DeliverX",
      "Explore specialist contributions and a searchable catalogue of 150 roles across 15 departments. Inspect availability separately from live mission activity.",
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
            Find the discipline your question needs. Inspect six example contributions below, then
            search the wider role catalogue. Availability describes a capability foundation—not
            participation in a live mission.
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
