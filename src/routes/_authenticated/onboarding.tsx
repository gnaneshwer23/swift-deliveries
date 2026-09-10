import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";
import { completeOnboarding } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceBootstrapQuery),
  component: OnboardingPage,
});

type InviteDraft = { email: string; role: "admin" | "member" };

function OnboardingPage() {
  const { data } = useSuspenseQuery(workspaceBootstrapQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(completeOnboarding);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(data.profile?.full_name ?? "");
  const [headline, setHeadline] = useState(data.profile?.headline ?? "");
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [invites, setInvites] = useState<InviteDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data.organisation) navigate({ to: "/workspace", replace: true });
  }, [data.organisation, navigate]);

  const finish = async () => {
    setSaving(true);
    try {
      const cleanInvites = invites.filter((i) => i.email.trim().includes("@"));
      await submit({
        data: { fullName, headline, orgName, orgDescription, orgWebsite, invites: cleanInvites },
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Your workspace is ready");
      navigate({ to: "/workspace", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mkt-ink)] px-5 py-10 text-[var(--mkt-text1)]">
      <div className="mx-auto max-w-lg">
        <MarketingLogo />
        <p className="mt-8 text-xs font-medium uppercase tracking-wide text-[var(--mkt-text2)]">
          Step {step} of 3
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {step === 1 ? "About you" : step === 2 ? "Your organisation" : "Invite your team"}
        </h1>

        <div className="mt-6 space-y-4 rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-6">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Senior Product Manager, Payments"
                />
              </div>
              <Button className="w-full" disabled={!fullName.trim()} onClick={() => setStep(2)}>
                Continue <ArrowRight className="ml-2 size-4" />
              </Button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organisation name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Northwind Product"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">What does it do?</Label>
                <Textarea
                  id="orgDescription"
                  rows={3}
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgWebsite">Website (optional)</Label>
                <Input
                  id="orgWebsite"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={orgName.trim().length < 2}
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="text-sm text-[var(--mkt-text2)]">
                Add teammates now or skip and do it later. Invitation links appear on your team page.
              </p>
              {invites.map((inv, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`invite-${index}`}>Email</Label>
                    <Input
                      id={`invite-${index}`}
                      type="email"
                      value={inv.email}
                      onChange={(e) =>
                        setInvites((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, email: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <Select
                    value={inv.role}
                    onValueChange={(v) =>
                      setInvites((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, role: v as "admin" | "member" } : item,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    onClick={() => setInvites((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              {invites.length < 10 ? (
                <Button
                  variant="ghost"
                  onClick={() => setInvites((prev) => [...prev, { email: "", role: "member" }])}
                >
                  <Plus className="mr-2 size-4" /> Add teammate
                </Button>
              ) : null}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => void finish()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {invites.length > 0 ? "Create workspace and invite" : "Create workspace"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
