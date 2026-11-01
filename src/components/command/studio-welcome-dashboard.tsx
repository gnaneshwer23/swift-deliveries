import { ArrowRight } from "lucide-react";
import { StudioProductMap } from "@/components/command/studio-product-map";

const TRUST = [
  {
    tone: "cyan" as const,
    title: "You stay in control",
    detail: "Major decisions and external actions wait for your explicit approval.",
  },
  {
    tone: "violet" as const,
    title: "Plain-language PM updates",
    detail: "The AI PM explains findings without jargon or unverified claims.",
  },
  {
    tone: "indigo" as const,
    title: "Traceable decisions",
    detail: "Important outputs keep a trail of sources, versions, and approvals.",
  },
] as const;

/**
 * Screen 1 — Welcome / onboarding dashboard (Studio entry).
 * Sets expectations before the idea submission dashboard.
 */
export function StudioWelcomeDashboard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="sd-shell" data-studio-screen="welcome">
      <div className="sd-topbar">
        <p className="sd-brand">DeliverX Studio</p>
      </div>

      <div className="sd-grid sd-grid-welcome">
        <section className="sd-card" aria-labelledby="sd-welcome-title">
          <h1 id="sd-welcome-title">Welcome to DeliverX</h1>
          <p className="sd-lede">
            Tell us about your idea. Our AI product team will investigate it and bring you a clear
            plan.
          </p>

          <ul className="sd-trust">
            {TRUST.map((item) => (
              <li key={item.title} data-tone={item.tone === "cyan" ? undefined : item.tone}>
                <span className="sd-trust-dot" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="sd-actions">
            <button type="button" className="sd-btn sd-btn-primary" onClick={onContinue}>
              Describe my idea
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="sd-note">You can edit your idea before the investigation is complete.</p>
        </section>

        <section className="sd-card" aria-label="How the Studio works">
          <p className="sd-rail-kicker">Live workspace preview</p>
          <h2>Your idea becomes a supervised case</h2>
          <p className="sd-lede" style={{ marginBottom: "1rem" }}>
            Specialists research and draft. Sample panels below show the shape of a case — not a
            finished product package.
          </p>
          <StudioProductMap interactive={false} ideaPreview="Your product idea" />
        </section>
      </div>
    </div>
  );
}
