import { createFileRoute } from "@tanstack/react-router";
import { PlatformPage } from "@/components/marketing/platform-pages";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/security")({
  head: () =>
    pageHead(
      "/security",
      "Security & Trust \u2014 DeliverX",
      "Understand the safeguards, the evidence behind an output and the limits of the current release.",
    ),
  component: Page,
});
function Page() {
  return (
    <PlatformPage
      eyebrow="Security & Trust"
      title="Your approval is part of the architecture."
      lead="Understand the safeguards, the evidence behind an output and the limits of the current release."
      sections={[
        {
          title: "Agents recommend. People approve.",
          body: "Lifecycle gates are human-only. High-impact decisions and evidence gaps escalate to the product owner. External actions need explicit approval.",
          art: "human-direction",
          steps: [
            "Inspect the recommendation",
            "Review dissent and hard vetoes",
            "Approve, reject or request more evidence",
          ],
        },
        {
          title: "Permissions and budgets bound the work.",
          body: "Server-side workspace checks and tool permissions constrain execution. Usage ceilings stop further billable steps. Review access and deployment configuration before handling sensitive material.",
          art: "specialist-team",
          steps: [
            "Assign the minimum necessary capability",
            "Keep workspace ownership checks on the server",
            "Pause when permission or budget is exhausted",
          ],
        },
        {
          title: "Inspect the claim, not just the label.",
          body: "Records distinguish agent review, automatic tests, human review and external attestation. These are different forms of evidence.",
          art: "product-delivery",
          steps: [
            "Show model or simulated generation mode",
            "Keep source references and test logs",
            "Do not imply certification or a security audit",
          ],
        },
      ]}
      flow={false}
    />
  );
}
