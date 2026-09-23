import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useSession } from "@/hooks/use-session";

type WorkspaceTarget =
  | "/workspace"
  | "/workspace/experience"
  | "/workspace/launchpad"
  | "/workspace/projects";

/**
 * Marketing call to action that respects an existing session: signed-out
 * visitors are sent to sign-up, signed-in people go straight to the matching
 * place inside their workspace instead of being asked to create an account.
 * While the session is still resolving we render the signed-out markup, so the
 * server and first client render agree.
 */
export function CtaLink({
  signedInTo,
  signedInLabel,
  signedOutLabel = "Get started",
  className = "btn btn-amber",
  style,
}: {
  signedInTo: WorkspaceTarget;
  signedInLabel: string;
  signedOutLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { user, loading } = useSession();

  if (!loading && user) {
    return (
      <Link to={signedInTo} className={className} style={style}>
        {signedInLabel}
      </Link>
    );
  }

  return (
    <Link to="/signup" className={className} style={style}>
      {signedOutLabel}
    </Link>
  );
}
