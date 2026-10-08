import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { getPublicCredential } from "@/lib/verify.functions";

export const Route = createFileRoute("/verify/$credentialId")({
  head: () => ({
    meta: [
      { title: "Verify a DeliverX credential" },
      {
        name: "description",
        content:
          "Check the live status of a DeliverX Verified credential — issued from a signed external attestation, revocable at any time.",
      },
      { property: "og:title", content: "Verify a DeliverX credential" },
      {
        property: "og:description",
        content: "Check the live status of a DeliverX Verified credential.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { credentialId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify", credentialId],
    queryFn: () => getPublicCredential({ data: { credentialId } }),
  });

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-xl px-5 py-20">
        {isLoading ? (
          <p className="text-sm text-[var(--mkt-text2)]">Checking…</p>
        ) : !data?.found ? (
          <Panel title="Credential not found">
            <p className="text-sm text-[var(--mkt-text2)]">
              We couldn't find this credential. Check the link, or ask the holder
              for a fresh one.
            </p>
          </Panel>
        ) : (
          <Panel
            title={data.status === "active" ? "Verified" : "Revoked"}
            tone={data.status === "active" ? "green" : "red"}
          >
            <p className="text-sm text-[var(--mkt-text2)]">
              {data.status === "active"
                ? `This credential confirms ${data.ownerName}'s work, based on a signed statement from someone outside DeliverX who saw it first-hand.`
                : "This credential has been revoked. It no longer counts as Verified."}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Achievement" value={data.achievementName} />
              {data.achievementDescription ? (
                <Row label="What it means" value={data.achievementDescription} />
              ) : null}
              {data.evidenceDescription ? (
                <Row label="Basis" value={data.evidenceDescription} />
              ) : null}
              <Row
                label="Issued"
                value={new Date(data.issuedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              {data.validUntil ? (
                <Row
                  label="Renewal due"
                  value={new Date(data.validUntil).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              ) : null}
              {data.artefactDigest ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--mkt-text2)]">
                    Frozen artefact fingerprint
                  </dt>
                  <dd className="mt-1 break-all rounded-lg bg-[var(--mkt-s2)] px-3 py-2 font-mono text-xs">
                    {data.artefactDigest}
                  </dd>
                </div>
              ) : null}
            </dl>

            <p className="mt-6 text-xs text-[var(--mkt-text2)]">
              Verified means one thing on DeliverX: an external person signed a
              fixed statement about work they saw. It is never set by AI scores,
              self-report, payment or platform staff. The attester's identity is
              held privately under the Trust Rail.
            </p>
          </Panel>
        )}
      </section>
    </MarketingLayout>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "green" | "red";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-8">
      <h1
        className={`text-xl font-semibold tracking-tight ${
          tone === "green"
            ? "text-[var(--mkt-green)]"
            : tone === "red"
              ? "text-red-600"
              : ""
        }`}
      >
        {title}
      </h1>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--mkt-text2)]">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
