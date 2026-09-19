import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/pilot")({
  head: () => ({
    meta: [
      { title: "Join the pilot — DeliverX" },
      {
        name: "description",
        content:
          "Pilot access is free: Experience, Launchpad, and Professional Workspace. Evidence stays private unless you choose to share it.",
      },
      { property: "og:title", content: "Join the DeliverX pilot" },
      {
        property: "og:description",
        content:
          "Build the record before you need it. Full access to all three products during the pilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PilotPage,
});

const tick = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--x-teal)" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" />
  </svg>
);

const GOALS = [
  "Break into product management",
  "Level up from junior to senior PM",
  "Build evidence for a role change",
  "Structured development in my current role",
  "Coaching programme participant",
  "Exploring — not sure yet",
];

const INCLUDED = [
  "Experience — simulated companies",
  "Launchpad · portfolio",
  "Professional Workspace",
  "Interview Lab · STAR prep",
  "Evidence ledger",
  "Verified pathway",
];

function PilotPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [goal, setGoal] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          current_role: currentRole || undefined,
          pilot_goal: goal || undefined,
          pilot: true,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    navigate({ to: "/login" });
  };

  return (
    <div className="dxs">
      <div className="pilot-wrap">
        {/* LEFT: story */}
        <div className="pilot-left">
          <Link to="/" className="pilot-logo">
            DeliverX
          </Link>

          <h1 className="pilot-headline">
            Build the record
            <br />
            <em>before you need it.</em>
          </h1>
          <p className="pilot-sub">
            Pilot access is free. You get all three products — Experience, Launchpad, and
            Professional Workspace. Evidence stays private unless you choose to share it.
          </p>

          <div className="pilot-points">
            <div className="pilot-point">
              <div className="pilot-point-icon pp-teal">
                <Check className="size-4" style={{ color: "var(--x-teal)" }} />
              </div>
              <div className="pilot-point-body">
                <h3>Start in Experience</h3>
                <p>
                  Join a simulated company as PM. Evidence builds from Day 1 — before you apply for
                  anything.
                </p>
              </div>
            </div>
            <div className="pilot-point">
              <div className="pilot-point-icon pp-amber">
                <Check className="size-4" style={{ color: "var(--x-amber)" }} />
              </div>
              <div className="pilot-point-body">
                <h3>Earn Verified externally</h3>
                <p>
                  When your evidence is strong enough, request attestation from someone who knows
                  your work. That's what lights the Verified signal.
                </p>
              </div>
            </div>
            <div className="pilot-point">
              <div className="pilot-point-icon pp-purple">
                <Check className="size-4" style={{ color: "var(--x-purple)" }} />
              </div>
              <div className="pilot-point-body">
                <h3>No payment gate during pilot</h3>
                <p>Full access to all three products from account creation.</p>
              </div>
            </div>
          </div>

          <div className="pilot-testimonial">
            <div className="pilot-quote">
              "They asked me to walk through a prioritisation decision. I pulled up the artefact in
              the room. That doesn't happen with a CV."
            </div>
            <div className="pilot-author">
              <strong>Early pilot participant</strong> · Career switcher from data analytics
            </div>
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="pilot-right">
          <div className="form-header">
            <h2>Create your account</h2>
            <p>Takes about 5 minutes. Your evidence record starts empty — that's correct.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="pilot-first">
                  First name
                </label>
                <input
                  id="pilot-first"
                  type="text"
                  className="form-input"
                  placeholder="Maya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pilot-last">
                  Last name
                </label>
                <input
                  id="pilot-last"
                  type="text"
                  className="form-input"
                  placeholder="Rodriguez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pilot-email">
                Email address
              </label>
              <input
                id="pilot-email"
                type="email"
                className="form-input"
                placeholder="maya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pilot-role">
                Current role
              </label>
              <input
                id="pilot-role"
                type="text"
                className="form-input"
                placeholder="e.g. Data Analyst at Barclays"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pilot-goal">
                What brings you here?
              </label>
              <select
                id="pilot-goal"
                className="form-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="">Select your goal</option>
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pilot-pass">
                Password
              </label>
              <input
                id="pilot-pass"
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Creating…
                </span>
              ) : (
                "Create account and start →"
              )}
            </button>
          </form>

          <div className="form-trust">
            <div className="trust-item">{tick}Evidence is private by default — you control sharing</div>
            <div className="trust-item">{tick}No payment required during pilot — full access</div>
            <div className="trust-item">{tick}Observation is off by default — you enable when ready</div>
          </div>

          <div className="included-section">
            <div className="included-title">What's included in pilot</div>
            <div className="included-grid">
              {INCLUDED.map((i) => (
                <div className="included-item" key={i}>
                  {tick}
                  {i}
                </div>
              ))}
            </div>
          </div>

          <div className="form-signin">
            Already have an account? <Link to="/login">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
