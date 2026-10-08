import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { getAttestationRequest, respondToAttestation } from "@/lib/evidence.functions";
import { ATTESTATION_LEVELS, ATTESTATION_STATEMENTS } from "@/lib/attestation";

const LEVEL_LABELS: Record<string, string> = {
  associate_pm: "Associate PM",
  product_manager: "Product manager",
  senior_pm: "Senior PM",
  lead_pm: "Lead PM",
};

export const Route = createFileRoute("/attest/$token")({
  head: () => ({
    meta: [
      { title: "Confirm someone's work — DeliverX" },
      {
        name: "description",
        content:
          "Confirm or dispute a capability claim based on work you have seen first-hand.",
      },
      { property: "og:title", content: "Confirm someone's work — DeliverX" },
      {
        property: "og:description",
        content: "Confirm or dispute a capability claim based on work you have seen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AttestPage,
});

function AttestPage() {
  const { token } = Route.useParams();
  const [done, setDone] = useState<string | null>(null);
  const [statement, setStatement] = useState("");
  const [statementKey, setStatementKey] = useState("");
  const [level, setLevel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["attestation", token],
    queryFn: () => getAttestationRequest({ data: { token } }),
  });

  const respond = useMutation({
    mutationFn: (decision: "confirmed" | "declined" | "disputed") =>
      respondToAttestation({ data: { token, decision, statement, statementKey, level } }),
    onSuccess: (_r, decision) => setDone(decision),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-xl px-5 py-20">
        {isLoading ? (
          <p className="text-sm text-[var(--mkt-text2)]">Loading…</p>
        ) : done ? (
          <Panel title="Thank you">
            <p className="text-sm text-[var(--mkt-text2)]">
              {done === "confirmed"
                ? "Your confirmation has been recorded. This is the only way a capability can show as Verified."
                : done === "disputed"
                  ? "Your dispute has been recorded and the claim is now under review."
                  : "Recorded. Nothing has been confirmed."}
            </p>
          </Panel>
        ) : !data?.valid ? (
          <Panel title="This link isn't active">
            <p className="text-sm text-[var(--mkt-text2)]">
              {data?.reason === "answered"
                ? "This request has already been answered."
                : "We couldn't find this request. Ask for a fresh link."}
            </p>
          </Panel>
        ) : (
          <Panel title={`Confirm ${data.personName}'s work`}>
            <p className="text-sm text-[var(--mkt-text2)]">
              You've been asked to confirm what you have seen first-hand
              {data.capabilityKey ? ` about their ${data.capabilityKey.replace(/_/g, " ")}` : ""}.
              Only confirm if you genuinely observed the work.
            </p>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium">Pick the statement you can stand behind</legend>
              <div className="mt-2 space-y-2">
                {ATTESTATION_STATEMENTS.map((s) => (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="statement"
                      value={s.key}
                      checked={statementKey === s.key}
                      onChange={() => setStatementKey(s.key)}
                      className="mt-0.5"
                    />
                    <span>{s.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block text-sm font-medium">
              The level this work demonstrates
              <select
                className="mt-1.5 w-full rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--mkt-green)]"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Choose a level…</option>
                {ATTESTATION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--mkt-green)]"
              placeholder="Optional comment (stored separately, never shown as the attestation itself)"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              maxLength={1000}
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={respond.isPending || !statementKey || !level}
                onClick={() => respond.mutate("confirmed")}
                className="rounded-full bg-[var(--mkt-green)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                I confirm this
              </button>
              <button
                type="button"
                disabled={respond.isPending}
                onClick={() => respond.mutate("disputed")}
                className="rounded-full border border-[var(--mkt-border)] px-5 py-2.5 text-sm font-medium"
              >
                I dispute this
              </button>
              <button
                type="button"
                disabled={respond.isPending}
                onClick={() => respond.mutate("declined")}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--mkt-text2)]"
              >
                I'd rather not say
              </button>
            </div>
          </Panel>
        )}
      </section>
    </MarketingLayout>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-8">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-3">{children}</div>
    </div>
  );
}
