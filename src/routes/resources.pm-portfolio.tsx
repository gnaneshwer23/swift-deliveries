import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/marketing/guide-article";

export const Route = createFileRoute("/resources/pm-portfolio")({
  head: () => ({
    meta: [
      { title: "How to build a PM portfolio employers can evaluate — DeliverX" },
      {
        name: "description",
        content:
          "A practical guide to assembling a Product Management portfolio hiring managers can inspect: problems framed, decisions taken, artefacts produced, outcomes stated without theatre.",
      },
      {
        property: "og:title",
        content: "How to build a PM portfolio employers can evaluate",
      },
      {
        property: "og:description",
        content:
          "Separate claims, evidence and capability. Show trade-offs and artefacts instead of course logos and unexplained readiness scores.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://deliverx.dev/resources/pm-portfolio" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/resources/pm-portfolio" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to build a PM portfolio employers can evaluate",
          description:
            "A practical guide to assembling a Product Management portfolio hiring managers can inspect: problems framed, decisions taken, artefacts produced, outcomes stated without theatre.",
          inLanguage: "en",
          mainEntityOfPage: "https://deliverx.dev/resources/pm-portfolio",
          author: { "@type": "Organization", name: "DeliverX", url: "https://deliverx.dev" },
          publisher: { "@type": "Organization", name: "DeliverX", url: "https://deliverx.dev" },
        }),
      },
    ],
  }),
  component: PmPortfolioGuide,
});

function PmPortfolioGuide() {
  return (
    <GuideArticle
      eyebrow="Guide · Portfolio"
      title="How to build a PM portfolio employers can evaluate"
      meta="Updated September 2026 · Pilot orientation"
      standfirst="Hiring managers do not need another gallery of course logos. They need a trail of work they can inspect: problems framed, decisions taken, artefacts produced, and outcomes stated without theatre."
    >
      <h2>Why most PM portfolios fail a serious review</h2>
      <p>
        People who evaluate Product Managers are not looking for a certificate wall. They are
        looking for judgement under constraint: how you framed a problem, what you cut, who
        disagreed with you, and which artefact supports the claim.
      </p>
      <p>
        Many candidates present tool badges, course logos and self-declared skill lists. That
        material shows exposure. It does not show trade-offs, stakeholder conflict, or
        prioritisation with incomplete information — the work someone else could audit.
      </p>
      <p>
        A second failure mode is decorative scoring: readiness percentages, case scores or
        confidence numbers with no method behind them. If you cannot explain how a number was
        produced, do not put it in front of an employer. Unexplained scores erode trust faster than
        a sparse but honest portfolio.
      </p>
      <p>
        A third failure mode is treating course completion as capability. Finishing a path is
        useful; it is not demonstrated competency. Keep those labels apart and your packaging stays
        credible.
      </p>

      <h2>Claims, evidence and capability are three different things</h2>
      <p>
        Use three buckets and refuse to blur them.
      </p>
      <ul>
        <li>
          <strong>Claims</strong> are what you say about yourself — goals, self-assessments,
          preferred domains. Useful for direction, not proof.
        </li>
        <li>
          <strong>Evidence</strong> is a provenance-backed record of work: a PRD version, a
          discovery note, a trade-off memo, a decision log, a launch checklist, an outcome you can
          cite. It answers who produced it, when, and in what context.
        </li>
        <li>
          <strong>Capability</strong> is a judgement over evidence against a stated framework, with
          a written rationale — not a course tick and not a badge.
        </li>
      </ul>
      <p>
        A fourth signal sits above all of these: independent confirmation. When a named person
        outside the platform reviews a specific claim and confirms it, that is attestation. In
        DeliverX it is the only thing that lights a Verified claim, and coach confirmation is shown
        as its own separate tier so nobody mistakes one for the other.
      </p>

      <h2>What belongs in an evaluable portfolio</h2>
      <p>
        Prefer a short set of deep case slices over a long list of shallow titles. For each slice,
        show the problem, the constraints, the options you considered, the decision you made, the
        artefact you produced, and the outcome — including partial or negative outcomes when that is
        the truth.
      </p>
      <p>
        Strong artefact types for Product Managers include problem framing notes, PRDs or
        opportunity briefs, discovery synthesis, prioritisation rationales, experiment designs,
        go-to-market outlines and delivery risk notes. Screenshots of tools without narrative are
        weak. Narrative without artefacts is also weak. Pair them.
      </p>
      <p>
        Label self-reported claims clearly. If a metric is estimated, say so. If the work happened
        in a simulated company, say so — simulated practice still develops judgement when the loop
        is explicit, and stating the context protects you in the follow-up questions.
      </p>

      <h3>A structure that survives questions</h3>
      <ul>
        <li>Context: company, role, timeframe, what constrained you.</li>
        <li>Problem: the decision that actually needed making.</li>
        <li>Options: what you rejected and why.</li>
        <li>Artefact: the document, model or plan a reviewer can open.</li>
        <li>Outcome: what changed, what did not, and what you would redo.</li>
      </ul>

      <h2>How DeliverX keeps the language honest</h2>
      <p>
        Work inside Experience produces immutable artefact versions with their provenance retained.
        Nothing becomes evidence without your submission, and submitted versions are frozen with a
        content hash so a reviewer can see the record was not edited afterwards.
      </p>
      <p>
        Capability judgements run against a versioned framework and return a level with a written
        rationale and the evidence it cited. Where readiness relies on a heuristic rather than a
        judged run, the interface says so. Observation of your work is off by default and only ever
        recorded with consent, and it never becomes evidence on its own.
      </p>
      <p>
        The result is a portfolio you can hand to a sceptical reviewer: every line traces back to an
        artefact, a judgement or an attestation, and each one is labelled for what it is.
      </p>
    </GuideArticle>
  );
}
