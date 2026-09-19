import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/marketing/guide-article";

export const Route = createFileRoute("/resources/star-interview-stories")({
  head: () => ({
    meta: [
      { title: "STAR interview stories grounded in real artefacts — DeliverX" },
      {
        name: "description",
        content:
          "Build STAR interview answers that hold up under follow-up questions by grounding Situation, Task, Action and Result in artefacts and decisions you can show.",
      },
      { property: "og:title", content: "STAR interview stories grounded in real artefacts" },
      {
        property: "og:description",
        content:
          "Vague STAR answers collapse under follow-up. Tie each letter to a document, a decision and an outcome you can defend.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://deliverx.dev/resources/star-interview-stories" },
    ],
    links: [
      { rel: "canonical", href: "https://deliverx.dev/resources/star-interview-stories" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "STAR interview stories grounded in real artefacts",
          description:
            "Build STAR interview answers that hold up under follow-up questions by grounding Situation, Task, Action and Result in artefacts and decisions you can show.",
          inLanguage: "en",
          mainEntityOfPage: "https://deliverx.dev/resources/star-interview-stories",
          author: { "@type": "Organization", name: "DeliverX", url: "https://deliverx.dev" },
          publisher: { "@type": "Organization", name: "DeliverX", url: "https://deliverx.dev" },
        }),
      },
    ],
  }),
  component: StarStoriesGuide,
});

function StarStoriesGuide() {
  return (
    <GuideArticle
      eyebrow="Guide · Interviews"
      title="STAR interview stories grounded in real artefacts"
      meta="Updated September 2026 · Pilot orientation"
      standfirst="STAR works when Situation, Task, Action and Result point to something you actually produced. Vague stories collapse under follow-up. This guide shows how to ground each letter in artefacts and decisions, then rehearse honestly."
    >
      <h2>Why polished STAR answers still fail</h2>
      <p>
        Most rehearsed answers fail on the second question, not the first. An interviewer accepts the
        story, then asks what the alternative was, who objected, what the numbers were, or what you
        would change. Answers built from adjectives run out at that point. Answers built from
        artefacts do not.
      </p>
      <p>
        The fix is not more polish. It is choosing stories where a document exists behind every
        claim, and knowing which document that is before you walk in.
      </p>

      <h2>Ground each letter</h2>
      <h3>Situation</h3>
      <p>
        State the context a reviewer could verify: the company or project, the role you held, the
        timeframe, and the constraint that made the situation hard. Skip scene-setting that carries
        no information.
      </p>
      <h3>Task</h3>
      <p>
        Name the decision you owned, not the team's mission. If you did not own it, say what part
        you did own. Interviewers respect a narrow, accurate claim far more than a broad one that
        unravels.
      </p>
      <h3>Action</h3>
      <p>
        This is where the artefact belongs. Reference the discovery synthesis, the prioritisation
        rationale, the PRD version, the risk note or the decision log. Say what you rejected and
        why, because trade-offs are the actual subject of the question.
      </p>
      <h3>Result</h3>
      <p>
        Give the outcome with its measurement method, and label estimates as estimates. Partial and
        negative outcomes are usable when you can explain what you learned and what you changed.
        Inventing a number is the one unrecoverable mistake.
      </p>

      <h2>Build a small, reusable set</h2>
      <p>
        You do not need twenty stories. Five or six covering recurring themes will carry most
        interviews: a prioritisation trade-off, a stakeholder conflict, a discovery insight that
        changed direction, a delivery risk you handled, an outcome that missed, and a decision you
        would reverse.
      </p>
      <ul>
        <li>One theme per story, with one primary artefact attached.</li>
        <li>Written in your own words, not generated for you.</li>
        <li>Rehearsed against follow-up questions, not just the opening prompt.</li>
      </ul>

      <h2>How DeliverX supports this</h2>
      <p>
        Work you submit in Experience becomes an immutable artefact version with its provenance
        retained, so each story has something concrete behind it. Launchpad packages those artefacts
        into a portfolio you can share on a private expiring link, and readiness signals state
        whether they came from a judged capability run or a labelled heuristic.
      </p>
      <p>
        Where AI helps you draft, the draft is labelled as a suggestion and stays out of your record
        until you edit and approve it. Verified claims are separate again: only a named independent
        attestor can confirm one, and coach confirmation is shown as its own distinct tier.
      </p>
      <p>
        The point of all this is narrow and practical — when an interviewer digs, you have a document
        to open and an honest label for every claim.
      </p>
    </GuideArticle>
  );
}
