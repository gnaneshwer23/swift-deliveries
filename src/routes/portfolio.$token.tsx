import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldQuestion } from "lucide-react";
import { publicPortfolioQuery } from "@/lib/launchpad-queries";

export const Route = createFileRoute("/portfolio/$token")({
  head: () => ({
    meta: [
      { title: "Evidence Portfolio — DeliverX" },
      {
        name: "description",
        content: "A private, provenance-backed evidence portfolio shared from DeliverX Launchpad.",
      },
      { property: "og:title", content: "Evidence Portfolio — DeliverX" },
      { property: "og:description", content: "Provenance-backed professional evidence, shared by its owner." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(publicPortfolioQuery(params.token)),
  errorComponent: () => <Shell title="This portfolio could not be loaded" />,
  notFoundComponent: () => <Shell title="This portfolio link is not valid" />,
  component: PortfolioPage,
});

const STRENGTH_LABEL: Record<string, string> = {
  self_reported: "Self-reported",
  observed: "Observed",
  assessed: "Assessed",
  externally_verified: "Externally verified",
};

function Shell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {children}
    </main>
  );
}

function PortfolioPage() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(publicPortfolioQuery(token));

  if (!data.valid) {
    const message =
      data.reason === "revoked"
        ? "The owner revoked this link."
        : data.reason === "expired"
          ? "This link has expired."
          : "This link is not valid.";
    return (
      <Shell title="Portfolio unavailable">
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </Shell>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        Evidence portfolio · {data.framework.key}@{data.framework.version}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.person.name}</h1>
      {data.person.headline ? (
        <p className="mt-2 text-sm text-muted-foreground">{data.person.headline}</p>
      ) : null}

      <section className="mt-8 rounded-lg border p-5">
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <div className="text-4xl font-bold tracking-tight">{data.readiness.percent}%</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Coverage</div>
          </div>
          <div>
            <div className="text-4xl font-bold tracking-tight">{data.readiness.verifiedCount}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Externally verified</div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            {data.readiness.explainable ? (
              <BadgeCheck className="size-4" />
            ) : (
              <ShieldQuestion className="size-4" />
            )}
            {data.readiness.label}
          </div>
        </div>
      </section>

      <h2 className="mt-10 text-lg font-semibold">Capabilities</h2>
      <ul className="mt-3 space-y-2">
        {data.capabilities.map((c) => (
          <li key={c.key} className="rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {c.level ? `Level ${c.level}` : "Not judged"}
                {c.band ? ` · ${c.band} confidence` : ""}
                {c.verified ? " · Verified" : ""}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {c.evidenceCount} ledger {c.evidenceCount === 1 ? "entry" : "entries"}
              {c.strongestStrength ? ` · strongest: ${STRENGTH_LABEL[c.strongestStrength]}` : ""}
            </div>
            {c.rationale ? <p className="mt-2 text-[12px]">{c.rationale}</p> : null}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Evidence</h2>
      <ul className="mt-3 space-y-3">
        {data.stories.map((s, i) => (
          <li key={i} className="border-t pt-3">
            <div className="text-sm font-semibold">{s.summary}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {STRENGTH_LABEL[s.strength] ?? s.strength} · {s.source} ·{" "}
              {new Date(s.occurredAt).toLocaleDateString()}
              {s.coachConfirmed ? " · coach confirmed" : ""}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[11px] text-muted-foreground">
        Shared by its owner through DeliverX Launchpad. Verified means an external person confirmed the claim.
        Levels come from a versioned framework, never from self-description.
      </p>
    </main>
  );
}
