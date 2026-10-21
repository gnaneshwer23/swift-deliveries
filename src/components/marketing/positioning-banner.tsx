import { Link } from "@tanstack/react-router";

type Variant = "career" | "workforce" | "workspace";

const COPY: Record<
  Variant,
  { lead: string; body: string; cta: string; to: "/signup" | "/experience" | "/how-it-works" }
> = {
  career: {
    lead: "Career evidence product.",
    body: "Experience, Launchpad and Prove build a defendable record. Looking for supervised AI labour instead?",
    cta: "Open Command Centre →",
    to: "/signup",
  },
  workforce: {
    lead: "Command Centre · Stage 1 preview.",
    body: "Wave 1 Available capabilities under human approval — not the full 150-role catalogue.",
    cta: "How it works →",
    to: "/how-it-works",
  },
  workspace: {
    lead: "Professional Workspace is for live delivery teams.",
    body: "Distinct from Command Centre (supervised AI missions) and from Experience (career simulation).",
    cta: "Compare paths →",
    to: "/how-it-works",
  },
};

export function PositioningBanner({ variant }: { variant: Variant }) {
  const c = COPY[variant];
  return (
    <div className="positioning-banner">
      <div className="positioning-banner-inner">
        <p style={{ margin: 0, flex: "1 1 280px" }}>
          <strong>{c.lead}</strong> {c.body}
        </p>
        <Link to={c.to} className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
          {c.cta}
        </Link>
      </div>
    </div>
  );
}
