import { createFileRoute } from "@tanstack/react-router";
import { PlatformPage } from "@/components/marketing/platform-pages";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/psi")({
  head: () =>
    pageHead(
      "/psi",
      "Product Super Intelligence \u2014 DeliverX",
      "PSI connects product context, specialist contributions and human governance across the lifecycle.",
    ),
  component: Page,
});
function Page() {
  return (
    <PlatformPage
      eyebrow="Product Super Intelligence"
      title="One system. Connected product judgement."
      lead="PSI connects product context, specialist contributions and human governance across the lifecycle."
      sections={[
        {
          title: "Product Brain holds the context.",
          body: "Your brief, sources and versioned artefacts form the working record that a mission can reference.",
          art: "product-brain",
          steps: [
            "Add a product objective and constraints",
            "Register evidence and identify gaps",
            "Retain the decisions behind the work",
          ],
        },
        {
          title: "Orchestration makes the handoff explicit.",
          body: "Tasks depend on upstream outputs. Failed, blocked or unapproved work cannot silently pass downstream.",
          art: "specialist-team",
          steps: [
            "Assign enabled capabilities",
            "Check handoff contracts",
            "Escalate blockers to the owner",
          ],
        },
        {
          title: "Governance keeps you in control.",
          body: "Human-only gates separate recommendations from approved work. Connected outcome learning is a future capability, not a current autonomous loop.",
          art: "human-direction",
          steps: [
            "Inspect positions and dissent",
            "Approve or return for revision",
            "Review what the team produced",
          ],
        },
      ]}
      flow={true}
    />
  );
}
