import { createFileRoute } from "@tanstack/react-router";
import { PlatformPage } from "@/components/marketing/platform-pages";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/product-brain")({
  head: () =>
    pageHead(
      "/product-brain",
      "Product Brain \u2014 DeliverX",
      "Keep the reasons, evidence and artefacts together so the next mission starts with context.",
    ),
  component: Page,
});
function Page() {
  return (
    <PlatformPage
      eyebrow="Product Brain"
      title="The memory behind the next decision."
      lead="Keep the reasons, evidence and artefacts together so the next mission starts with context."
      sections={[
        {
          title: "From a source to a decision.",
          body: "The working record connects supplied sources to recommendations. Source quality and missing evidence remain visible.",
          art: "evidence-decision",
          steps: [
            "Research records a source and its limits",
            "Specialists reference that evidence",
            "A decision preserves alternatives and rationale",
          ],
        },
        {
          title: "From a decision to an artefact.",
          body: "Versioned outputs and the audit trail let you trace what was decided and what was produced. A full interactive knowledge graph is planned.",
          art: "product-brain",
          steps: [
            "Retain the approved direction",
            "Inspect document and prototype versions",
            "Export the record with generation labels",
          ],
        },
        {
          title: "From observation to the next question.",
          body: "Add real feedback and measured results to inform a later brief. Automatic outcome collection and adaptive learning are planned.",
          art: "learning-loop",
          steps: [
            "You supply observed results",
            "Separate observations from hypotheses",
            "Frame the next experiment",
          ],
        },
      ]}
      flow={false}
    />
  );
}
