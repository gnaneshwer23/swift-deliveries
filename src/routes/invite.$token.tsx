import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { acceptInvitation, getInvitationPreview } from "@/lib/workspace.functions";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Join an organisation — DeliverX" },
      { name: "description", content: "Accept your invitation to a DeliverX organisation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accept = useServerFn(acceptInvitation);
  const [joining, setJoining] = useState(false);

  const preview = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitationPreview({ data: { token } }),
  });

  const join = async () => {
    setJoining(true);
    try {
      await accept({ data: { token } });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("You're in");
      navigate({ to: "/workspace", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--mkt-ink)] px-5 text-[var(--mkt-text1)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-8 text-center">
        <div className="flex justify-center">
          <MarketingLogo />
        </div>

        {preview.isLoading ? (
          <Loader2 className="mx-auto mt-8 size-5 animate-spin text-[var(--mkt-text2)]" />
        ) : !preview.data?.valid ? (
          <>
            <h1 className="mt-8 text-xl font-semibold">This invitation isn't valid</h1>
            <p className="mt-2 text-sm text-[var(--mkt-text2)]">
              It may have been used, revoked or expired. Ask whoever invited you for a new link.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full border border-[var(--mkt-border)] px-4 py-2 text-sm font-medium"
            >
              Back to home
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-xl font-semibold">
              Join {preview.data.organisationName}
            </h1>
            <p className="mt-2 text-sm text-[var(--mkt-text2)]">
              Invited as {preview.data.role} · {preview.data.email}
            </p>

            {loading ? (
              <Loader2 className="mx-auto mt-6 size-5 animate-spin text-[var(--mkt-text2)]" />
            ) : user ? (
              <Button className="mt-6 w-full" onClick={() => void join()} disabled={joining}>
                {joining ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Accept invitation
              </Button>
            ) : (
              <div className="mt-6 space-y-2">
                <p className="text-sm text-[var(--mkt-text2)]">
                  Sign in with {preview.data.email} to accept.
                </p>
                <Link
                  to="/signup"
                  className="block rounded-full bg-[var(--mkt-green)] px-4 py-2.5 text-sm font-medium text-white"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="block rounded-full border border-[var(--mkt-border)] px-4 py-2.5 text-sm font-medium"
                >
                  I already have an account
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
