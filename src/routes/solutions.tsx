import { createFileRoute } from "@tanstack/react-router";
import { PlatformPage } from "@/components/marketing/platform-pages";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/solutions")({
  head: () =>
    pageHead(
      "/solutions",
      "Solutions \u2014 DeliverX",
      "Use the same evidence-to-decision workflow whether you are learning to build, validating an idea or improving an existing product.",
    ),
  component: Page,
});
function Page() {
  return (
    <PlatformPage
      eyebrow="Solutions"
      title="Different teams. One product thread."
      lead="Use the same evidence-to-decision workflow whether you are learning to build, validating an idea or improving an existing product."
      sections={[
        {
          title: "Founders & startups: choose what to build.",
          body: "Turn a broad idea into a bounded question and inspect the evidence before expanding scope.",
          art: "evidence-decision",
          steps: [
            "Input: audience, problem and constraints",
            "Mission: compare target segments or MVP options",
            "Output: decision brief and next experiment",
          ],
        },
        {
          title: "Product managers & teams: explain the trade-off.",
          body: "Bring the product objective and available research into a mission your team can inspect.",
          art: "specialist-team",
          steps: [
            "Input: a product problem and real evidence",
            "Mission: evaluate an onboarding improvement",
            "Output: alternatives, decision record and prototype brief",
          ],
        },
        {
          title: "Students & builders: learn through the work.",
          body: "Build a product while seeing how research, design and engineering judgements connect. Agent output supports learning; it does not replace your responsibility to inspect it.",
          art: "product-delivery",
          steps: [
            "Input: a learning goal and product idea",
            "Mission: scope and prototype a useful workflow",
            "Output: reviewable artefacts and a reflection on decisions",
          ],
        },
      ]}
      flow={false}
    />
  );
}
