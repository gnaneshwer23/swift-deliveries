import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Link2, ShieldQuestion } from "lucide-react";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { launchpadPackQuery } from "@/lib/launchpad-queries";
import { createPortfolioShare, revokePortfolioShare } from "@/lib/launchpad.functions";

export const Route = createFileRoute("/_authenticated/workspace/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad Readiness Pack — DeliverX" },
      {
        name: "description",
        content:
          "Package judged evidence into an honest readiness story, then share it with a private, expiring link.",
      },
      { property: "og:title", content: "Launchpad Readiness Pack — DeliverX" },
      { property: "og:description", content: "Honest, explainable readiness built from your evidence record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(launchpadPackQuery),
  component: LaunchpadPage,
});

const BASIS_LABEL: Record<string, string> = {
  score_run: "Judged by the Capability Engine",
  evidence_only: "Evidence recorded, not judged yet",
  self_reported_only: "Self-reported only — not evidence",
  no_evidence: "No evidence yet",
};

const STRENGTH_LABEL: Record<string, string> = {
  self_reported: "Self-reported",
  observed: "Observed",
  assessed: "Assessed",
  externally_verified: "Externally verified",
};

function LaunchpadPage() {
  const { data } = useSuspenseQuery(launchpadPackQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["launchpad"] });

  const [label, setLabel] = useState("");
  const [includeSelfReported, setIncludeSelfReported] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createPortfolioShare({ data: { label, includeSelfReported } }),
    onSuccess: (r) => {
      const link = `${window.location.origin}/portfolio/${r.token}`;
      setLastLink(link);
      void navigator.clipboard?.writeText(link).catch(() => undefined);
      setLabel("");
      toast.success("Link created and copied. It expires in 90 days and you can revoke it any time.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokePortfolioShare({ data: { id } }),
    onSuccess: () => {
      toast.success("Link revoked. Anyone holding it now sees nothing.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Launchpad"
      subtitle="Your readiness pack, built only from what your evidence record can support."
    >
      <div className="space-y-5">
        <WorkspaceCard
          title="Readiness"
          description={`${data.readiness.judgedCount} of ${data.readiness.capabilityCount} capabilities judged against ${data.framework.key}@${data.framework.version}.`}
        >
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <div className="text-4xl font-bold tracking-tight">{data.readiness.percent}%</div>
              <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--x-slate-light)" }}>
                Coverage
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold tracking-tight">{data.readiness.verifiedCount}</div>
              <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--x-slate-light)" }}>
                Externally verified
              </div>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px]"
              style={{
                borderColor: "var(--x-border)",
                color: data.readiness.explainable ? "var(--x-teal)" : "var(--x-amber)",
              }}
            >
              {data.readiness.explainable ? (
                <BadgeCheck className="size-4" />
              ) : (
                <ShieldQuestion className="size-4" />
              )}
              {data.readiness.label}
            </div>
          </div>
          {data.lastRunAt ? (
            <p className="mt-4 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
              Last judgement run {new Date(data.lastRunAt).toLocaleString()}.
            </p>
          ) : (
            <p className="mt-4 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
              No judgement run yet. Run scoring on your capability profile to make readiness explainable.
            </p>
          )}
        </WorkspaceCard>

        <WorkspaceCard title="Capability story" description="Each line says exactly what supports it.">
          <ul className="space-y-2">
            {data.capabilities.map((c) => (
              <li
                key={c.key}
                className="rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--x-border)", background: "var(--x-paper)" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold">{c.name}</span>
                  <span className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                    {c.level ? `Level ${c.level}` : "Not judged"}
                    {c.band ? ` · ${c.band} confidence` : ""}
                    {c.verified ? " · Verified" : ""}
                  </span>
                </div>
                <div className="mt-1 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                  {BASIS_LABEL[c.basis]} · {c.evidenceCount} ledger{" "}
                  {c.evidenceCount === 1 ? "entry" : "entries"}
                  {c.strongestStrength ? ` · strongest: ${STRENGTH_LABEL[c.strongestStrength]}` : ""}
                </div>
                {c.rationale ? (
                  <p className="mt-2 text-[12px]" style={{ color: "var(--x-slate)" }}>
                    {c.rationale}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard
          title="Interview stories"
          description="Drawn from real ledger entries. Self-reported claims are excluded."
        >
          {data.stories.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--x-slate-light)" }}>
              Nothing yet. Complete Experience tasks or record real work to build stories.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.stories.map((s) => (
                <li key={s.id} className="border-t pt-3 text-[12px]" style={{ borderColor: "var(--x-border)" }}>
                  <div className="font-semibold">{s.summary}</div>
                  <div className="mt-1 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                    {s.capabilityKey ?? "unmapped"} · {STRENGTH_LABEL[s.strength] ?? s.strength} ·{" "}
                    {new Date(s.occurredAt).toLocaleDateString()}
                    {s.coachConfirmed ? " · coach confirmed" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Share your readiness pack"
          description="Private by default. Each link expires after 90 days and can be revoked."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Who is this link for? e.g. Northwind interview"
              className="max-w-sm"
            />
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--x-slate)" }}>
              <input
                type="checkbox"
                checked={includeSelfReported}
                onChange={(e) => setIncludeSelfReported(e.target.checked)}
              />
              Include self-reported claims (clearly labelled)
            </label>
            <Button size="sm" disabled={create.isPending || label.trim().length < 2} onClick={() => create.mutate()}>
              {create.isPending ? "Creating…" : "Create link"}
            </Button>
          </div>

          {lastLink ? (
            <p className="mt-3 break-all text-[11px] font-mono" style={{ color: "var(--x-teal)" }}>
              {lastLink}
            </p>
          ) : null}

          <ul className="mt-4 space-y-2">
            {data.shares.map((s) => {
              const expired = new Date(s.expiresAt).getTime() < Date.now();
              const dead = Boolean(s.revokedAt) || expired;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--x-border)", opacity: dead ? 0.55 : 1 }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      <Link2 className="size-4" /> {s.label}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                      {s.revokedAt
                        ? `Revoked ${new Date(s.revokedAt).toLocaleDateString()}`
                        : expired
                          ? "Expired"
                          : `Expires ${new Date(s.expiresAt).toLocaleDateString()}`}{" "}
                      · {s.viewCount} {s.viewCount === 1 ? "view" : "views"}
                      {s.includeSelfReported ? " · includes self-reported" : ""}
                    </div>
                  </div>
                  {dead ? null : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = `${window.location.origin}/portfolio/${s.token}`;
                          void navigator.clipboard?.writeText(link).catch(() => undefined);
                          setLastLink(link);
                          toast.success("Link copied.");
                        }}
                      >
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                        Revoke
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </WorkspaceCard>

        <p className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
          Launchpad never invents a level. Verified appears only where an external person confirmed the claim.
        </p>
      </div>
    </WorkspaceShell>
  );
}
