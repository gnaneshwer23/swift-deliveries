import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldQuestion } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { evidenceOverviewQuery } from "@/lib/evidence-queries";
import { requestAttestation, runCapabilityScoring } from "@/lib/evidence.functions";

export const Route = createFileRoute("/_authenticated/workspace/capability")({
  head: () => ({ meta: [{ title: "Capability Picture — DeliverX" }, { name: "description", content: "Review evidence-backed capability judgements and external attestations." }, { property: "og:title", content: "Capability Picture — DeliverX" }, { property: "og:description", content: "Your evidence-backed professional capability picture." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(evidenceOverviewQuery),
  component: CapabilityPage,
});

const BAND_LABEL: Record<string, string> = {
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "High confidence",
};

const ATTEST_LABEL: Record<string, string> = {
  unattested: "Not confirmed by anyone",
  attestation_requested: "Waiting on confirmation",
  externally_attested: "Externally confirmed",
  disputed: "Disputed — under review",
};

function CapabilityPage() {
  const { data } = useSuspenseQuery(evidenceOverviewQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["evidence"] });

  const [openClaim, setOpenClaim] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");

  const nameFor = (key: string) =>
    data.capabilities.find((c) => c.key === key)?.name ?? key;

  const score = useMutation({
    mutationFn: () => runCapabilityScoring({ data: { runKind: "interim" } }),
    onSuccess: (r) => {
      toast.success(`Judged ${r.judged} capabilities from your ledger.`);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const attest = useMutation({
    mutationFn: (input: {
      claimId: string;
      attestorName: string;
      attestorEmail: string;
      relationship: string;
    }) => requestAttestation({ data: input }),
    onSuccess: (r) => {
      const link = `${window.location.origin}/attest/${r.token}`;
      void navigator.clipboard?.writeText(link);
      toast.success("Request created. The confirmation link is copied to your clipboard.");
      setOpenClaim(null);
      setName("");
      setEmail("");
      setRelationship("");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Capability"
      subtitle={`Judged under ${data.framework.name} (${data.framework.key}@${data.framework.version}). Only the scoring engine writes these — no screen can.`}
    >
      <WorkspaceCard
        title="Readiness"
        description={
          data.readiness.basis === "mixed"
            ? "Part scoring run, part coverage estimate. Treat it as a guide, not a grade."
            : "This is a coverage estimate only — how much of the framework your evidence touches."
        }
        action={
          <button
            type="button"
            onClick={() => score.mutate()}
            disabled={score.isPending}
            className="bg-[var(--mkt-text1)] px-4 py-3 text-xs font-bold uppercase text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green)] disabled:opacity-60"
          >
            {score.isPending ? "Judging…" : "Run scoring"}
          </button>
        }
      >
        <div className="flex items-end gap-3">
          <p className="font-serif text-5xl font-black">{data.readiness.percent}%</p>
          <span className="mb-1 border border-[var(--mkt-border)] px-2 py-0.5 font-mono text-[0.625rem] uppercase text-[var(--mkt-text2)]">
            {data.readiness.basis === "mixed" ? "mixed" : "coverage estimate"}
          </span>
        </div>
      </WorkspaceCard>

      <WorkspaceCard
        title="Your capability picture"
        description="Shared across your profile, portfolio and packaging. Verified only lights when someone outside confirms it."
      >
        {data.claims.length === 0 ? (
          <p className="text-sm text-[var(--mkt-text2)]">
            Nothing judged yet. Record evidence, then run scoring.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.claims.map((c) => (
              <li key={c.id} className="border border-[var(--mkt-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {nameFor(c.capabilityKey)}
                      {c.verified ? (
                        <span className="flex items-center gap-1 bg-[var(--mkt-green)] px-2 py-0.5 text-xs text-[var(--mkt-on-dark)]">
                          <BadgeCheck className="size-3.5" /> Verified
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mkt-text2)]">
                      Level {c.level ?? "—"} · {BAND_LABEL[c.band ?? ""] ?? "No band yet"} ·{" "}
                      {ATTEST_LABEL[c.attestationStatus] ?? c.attestationStatus}
                    </p>
                  </div>
                  {c.verified ? null : (
                    <button
                      type="button"
                      onClick={() => setOpenClaim(openClaim === c.id ? null : c.id)}
                      className="border border-[var(--mkt-border-l)] px-4 py-2 text-xs font-bold uppercase"
                    >
                      Ask someone to confirm
                    </button>
                  )}
                </div>

                {openClaim === c.id ? (
                  <form
                    className="mt-4 grid gap-3 sm:grid-cols-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      attest.mutate({
                        claimId: c.id,
                        attestorName: name,
                        attestorEmail: email,
                        relationship,
                      });
                    }}
                  >
                    <input
                      className={inputCls}
                      placeholder="Their name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <input
                      className={inputCls}
                      type="email"
                      placeholder="Their email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <input
                      className={inputCls}
                      placeholder="How they know your work"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    />
                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={attest.isPending}
                        className="bg-[var(--mkt-text1)] px-5 py-3 text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)] disabled:opacity-60"
                      >
                        {attest.isPending ? "Creating…" : "Create confirmation link"}
                      </button>
                      <p className="mt-2 text-xs text-[var(--mkt-text2)]">
                        Emails aren't set up yet, so the link is copied for you to send.
                      </p>
                    </div>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </WorkspaceCard>

      {data.latestRun ? (
        <WorkspaceCard
          title="Why these bands"
          description={`Last run: ${data.latestRun.runKind}, ${new Date(data.latestRun.createdAt).toLocaleString()}`}
        >
          <ul className="space-y-3">
            {data.latestRun.judgements.map((j) => (
              <li key={j.capabilityKey} className="text-sm">
                <p className="font-medium">
                  {nameFor(j.capabilityKey)} — level {j.level}, {BAND_LABEL[j.band] ?? j.band}
                </p>
                <p className="mt-1 text-xs text-[var(--mkt-text2)]">{j.rationale}</p>
              </li>
            ))}
          </ul>
        </WorkspaceCard>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-[var(--mkt-text2)]">
        <ShieldQuestion className="mt-0.5 size-4 shrink-0" />
        A scoring run is not Verified. Learning, ceremonies and practice interviews never change
        these levels.
      </p>
    </WorkspaceShell>
  );
}

const inputCls =
  "w-full border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm text-[var(--mkt-text1)] outline-hidden focus:border-[var(--mkt-green)]";
