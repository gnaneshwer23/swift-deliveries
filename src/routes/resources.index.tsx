import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Resources — DeliverX" },
      {
        name: "description",
        content:
          "Product paths, flagship guides and orientation notes on evidence, capability and what Verified means at DeliverX.",
      },
      { property: "og:title", content: "DeliverX resources — evidence-backed starting points" },
      {
        property: "og:description",
        content:
          "Guides on building an evaluable PM portfolio and grounding STAR stories in real artefacts, plus how DeliverX separates learning, evidence and capability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResourcesPage,
});

const productPaths = [
  {
    title: "Start with Experience",
    body: "Build practical Product Management experience inside seeded AI companies before you apply. Work produces artefacts; you decide what becomes evidence.",
    to: "/experience",
    cta: "Explore Experience",
  },
  {
    title: "Prepare with Launchpad",
    body: "Turn experience into interviews with readiness that cites its source, evidence-backed CV and portfolio packaging, and interview stories tied to real artefacts.",
    to: "/launchpad",
    cta: "Explore Launchpad",
  },
  {
    title: "Deliver with Professional Workspace",
    body: "Work with role-based AI teammates on tasks, meetings, decisions, risks and artefacts. AI drafts; you edit, approve and submit.",
    to: "/professional-workspace",
    cta: "Explore Professional Workspace",
  },
] as const;

const guides = [
  {
    index: "01",
    title: "How to build a PM portfolio employers can evaluate",
    body: "Hiring managers do not need another gallery of course logos. They need a trail of work they can inspect: problems framed, decisions taken, artefacts produced, and outcomes stated without theatre.",
    to: "/resources/pm-portfolio",
  },
  {
    index: "02",
    title: "STAR interview stories grounded in real artefacts",
    body: "STAR works when Situation, Task, Action and Result point to something you actually produced. Vague stories collapse under follow-up. Ground each letter in artefacts and decisions.",
    to: "/resources/star-interview-stories",
  },
] as const;

const notes = [
  {
    index: "01",
    title: "Evidence vs claims vs learning",
    body: "Knowledge is exposure. Evidence is a provenance-backed record of work. Capability is a judgement over evidence — not a course completion tick. AI drafts and coach notes are assistants, not proof. Learning never lights Verified and never writes capability levels.",
    to: "/how-it-works",
    cta: "Read how DeliverX works",
  },
  {
    index: "02",
    title: "AI product experience without theatre",
    body: "Simulated company work develops judgement when the loop is explicit: realistic challenges, human decisions, and an append-only evidence ledger. Observation consent defaults off. Readiness states whether it came from a scoring run or a labelled heuristic.",
    to: "/experience",
    cta: "Explore Experience",
  },
  {
    index: "03",
    title: "What Verified means here",
    body: "Verified is an attestation signal, not a badge you earn by finishing work. A named independent attestor must confirm a specific claim. A scoring run alone never lights it, and coach confirmation is recorded as a separate, distinctly labelled tier.",
    to: "/about",
    cta: "About DeliverX",
  },
] as const;

function ResourcesPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-label">Resources</span>
            <h1 className="mkt-section-title mt-3">Evidence-backed starting points</h1>
            <p className="mkt-section-sub mx-auto">
              Short paths into the DeliverX products, plus full guides on PM portfolios and STAR
              stories grounded in evidence. No job-board listings, no unexplained readiness
              percentages, and no claim that finishing a course equals capability.
            </p>
          </div>

          <div className="mt-16">
            <h2 className="font-serif text-2xl tracking-[-0.01em] text-[var(--mkt-text1)]">
              Product paths
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mkt-text3)]">
              Build the experience, land the opportunity, succeed in the role. Pick the stage that
              matches where you are.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {productPaths.map((item) => (
                <div key={item.title} className="mkt-card flex flex-col p-6">
                  <h3 className="font-serif text-lg tracking-[-0.01em] text-[var(--mkt-text1)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--mkt-text3)]">
                    {item.body}
                  </p>
                  <Link
                    to={item.to}
                    className="mt-5 text-sm font-medium text-[var(--mkt-accent)] hover:underline"
                  >
                    {item.cta} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20">
            <h2 className="font-serif text-2xl tracking-[-0.01em] text-[var(--mkt-text1)]">
              Flagship guides
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mkt-text3)]">
              Full articles written for people preparing to be evaluated — not placement guarantees
              or readiness theatre.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {guides.map((guide) => (
                <article key={guide.title} className="mkt-card flex flex-col p-7">
                  <span className="mkt-label">{guide.index}</span>
                  <h3 className="mt-3 font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
                    {guide.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--mkt-text3)]">
                    {guide.body}
                  </p>
                  <Link
                    to={guide.to}
                    className="mt-5 text-sm font-medium text-[var(--mkt-accent)] hover:underline"
                  >
                    Read the guide &rarr;
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-20">
            <h2 className="font-serif text-2xl tracking-[-0.01em] text-[var(--mkt-text1)]">
              Orientation notes
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mkt-text3)]">
              Short trust framing that sits beside the guides.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {notes.map((note) => (
                <div key={note.title} className="mkt-card flex flex-col p-6">
                  <span className="mkt-label">{note.index}</span>
                  <h3 className="mt-3 font-serif text-lg tracking-[-0.01em] text-[var(--mkt-text1)]">
                    {note.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--mkt-text3)]">
                    {note.body}
                  </p>
                  <Link
                    to={note.to}
                    className="mt-5 text-sm font-medium text-[var(--mkt-accent)] hover:underline"
                  >
                    {note.cta} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mkt-card mt-20 p-7">
            <span className="mkt-label">Also useful</span>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--mkt-text2)]">
              <Link to="/how-it-works" className="hover:text-[var(--mkt-accent)]">
                How it works
              </Link>
              <Link to="/about" className="hover:text-[var(--mkt-accent)]">
                About
              </Link>
              <Link to="/pricing" className="hover:text-[var(--mkt-accent)]">
                Plans
              </Link>
              <Link to="/privacy" className="hover:text-[var(--mkt-accent)]">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
