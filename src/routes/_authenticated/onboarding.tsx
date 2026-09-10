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
    <div className="min-h-screen bg-[var(--mkt-ink)] text-[var(--mkt-text1)] [&_button]:rounded-none [&_input]:h-11 [&_input]:rounded-none [&_textarea]:rounded-none [&_[role=combobox]]:h-11 [&_[role=combobox]]:rounded-none">
      <header className="border-b border-[var(--mkt-border-l)] bg-[var(--mkt-s1)]"><div className="mx-auto flex h-[var(--mkt-navh)] max-w-[var(--mkt-maxw)] items-center border-x border-[var(--mkt-border)] px-5"><MarketingLogo /></div></header>
      <main className="mx-auto grid min-h-[calc(100vh-var(--mkt-navh))] max-w-[var(--mkt-maxw)] border-x border-[var(--mkt-border)] lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.75fr)]">
        <section className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
          <p className="mkt-label">Personal setup / Step 0{step} of 03</p>
          <h1 className="mt-8 max-w-2xl font-serif text-5xl font-black uppercase leading-[0.92] sm:text-6xl">
            {step === 1 ? <>Start with<br /><span className="text-[var(--mkt-text-faint)]">your context.</span></> : step === 2 ? <>Define where<br /><span className="text-[var(--mkt-text-faint)]">you work.</span></> : <>Bring in<br /><span className="text-[var(--mkt-text-faint)]">your team.</span></>}
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[var(--mkt-text2)]">{step === 1 ? "Set the professional identity people in your workspace will see." : step === 2 ? "Create the organisation that owns this workspace and its shared context." : "Invite collaborators now, or continue alone and add them later."}</p>
          <div className="mt-12 grid grid-cols-3 border border-[var(--mkt-border)]">
            {[1, 2, 3].map((item) => <div key={item} className={`h-2 border-r border-[var(--mkt-border)] last:border-r-0 ${item <= step ? "bg-[var(--mkt-green)]" : "bg-[var(--mkt-s2)]"}`} />)}
          </div>
        </section>

        <section className="bg-[var(--mkt-s1)] p-6 sm:p-10 lg:p-12">
          <p className="font-mono text-[0.6875rem] font-bold uppercase text-[var(--mkt-green-m)]">{step === 1 ? "Your details" : step === 2 ? "Organisation details" : "Team access"}</p>
        <div className="mt-8 space-y-5 border-t border-[var(--mkt-border-l)] pt-8">
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
              <Button className="h-11 w-full bg-[var(--mkt-text1)] text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]" disabled={!fullName.trim()} onClick={() => setStep(2)}>
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
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="h-11 flex-1 bg-[var(--mkt-text1)] text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]"
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
                <Button variant="outline" onClick={() => setStep(2)} disabled={saving}>
                  Back
                </Button>
                <Button className="h-11 flex-1 bg-[var(--mkt-text1)] text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]" onClick={() => void finish()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {invites.length > 0 ? "Create workspace and invite" : "Create workspace"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
        </section>
      </main>
    </div>
  );
}
