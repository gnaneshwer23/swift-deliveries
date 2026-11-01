/**
 * Your profile: who you are, what you're building towards, how much the team explains,
 * and what your projects have reached. Everything shown is read from your saved profile
 * and project records.
 */
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, LogOut, Pencil } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ExplainSwitch } from "@/components/command/first-run-panel";
import type { AppUser } from "@/lib/auth/client";
import { auth } from "@/lib/auth/client";
import { DX_GOALS, DX_ROLES, DX_TEAM_SIZES, type DxProfile } from "@/lib/dx-profile";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { saveMyProfile } from "@/lib/profile.functions";
import { myProfileQuery } from "@/lib/profile-queries";
import { initialsOf, profileProgress } from "@/lib/profile-summary";
import { useSignOut } from "@/hooks/use-sign-out";
import "@/styles/projects-dashboard.css";
import "@/styles/profile.css";

type Fields = Pick<DxProfile, "fullName" | "role" | "teamSize" | "goal" | "firstIdea">;

function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pf-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
        >
          {value === o ? <Check size={13} aria-hidden="true" /> : null}
          {o}
        </button>
      ))}
    </div>
  );
}

export function ProfilePage({ user, profile }: { user: AppUser; profile: DxProfile }) {
  const qc = useQueryClient();
  const signOut = useSignOut();
  const live = useQuery(myProfileQuery);
  const current = live.data ?? profile;
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  // Only count what the record shows: if projects can't be read, say so instead of showing 0.
  const progressReady = Boolean(home.data?.ready);
  const progress = profileProgress(home.data?.ready ? home.data.missions : []);

  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Fields>(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (data: Fields) => saveMyProfile({ data }),
    onSuccess: (next) => {
      qc.setQueryData(myProfileQuery.queryKey, next);
      setEditing(false);
      setError(null);
      setSaved("Saved.");
      // The profile is saved either way; tell the user if the sign-in name didn't follow.
      void auth.updateName(next.fullName).then((err) => {
        if (err) setSaved("Saved. Your sign-in name will update next time you sign in.");
      });
    },
    onError: (err) =>
      setError(
        err instanceof Error && /unauthori[sz]ed|sign in|session/i.test(err.message)
          ? "Your session has ended. Sign in again, then save."
          : "Your changes couldn’t be saved. Try again.",
      ),
  });

  const name = current.fullName || user.email || "You";
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setSaved(null);
    setFields((f) => ({ ...f, [key]: value }));
  };
  const valid = fields.fullName.trim().length >= 2 && fields.role && fields.teamSize && fields.goal;

  const stats = [
    { label: "Live projects", value: String(progress.liveProjects) },
    { label: "Project steps reached", value: `${progress.stepsReached} / ${progress.stepsTotal}` },
    {
      label: "Lessons for steps reached",
      value: `${progress.lessonsForSteps} / ${progress.lessonsTotal}`,
    },
  ];

  return (
    <div className="dxs pf-page">
      <header className="pf-top">
        <BrandLogo to="/" tagline="Product Super Intelligence" />
        <Link to="/command" className="pf-back">
          Back to Studio <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <main className="pf-main">
        <section className="pf-hero" aria-labelledby="pf-name">
          <span className="pf-avatar" aria-hidden="true">
            {initialsOf(name)}
          </span>
          <div className="pf-hero-text">
            <p className="pf-eyebrow">Your profile</p>
            <h1 id="pf-name">{name}</h1>
            <p className="pf-email">{user.email}</p>
            <p className="pf-tags">
              {current.role ? <span>{current.role}</span> : null}
              {current.teamSize ? <span>Team: {current.teamSize}</span> : null}
              {current.goal ? <span className="pf-tag-goal">Goal: {current.goal}</span> : null}
            </p>
          </div>
        </section>

        {!home.isLoading && !progressReady ? (
          <p className="pf-muted" role="status">
            Project progress couldn’t be loaded right now.
          </p>
        ) : null}
        <ul className="pf-stats" aria-label="Your progress">
          {stats.map((s) => (
            <li key={s.label}>
              <b>{progressReady ? s.value : "—"}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="pf-grid">
          <section className="pf-card" aria-labelledby="pf-about">
            <div className="pf-card-head">
              <h2 id="pf-about">About you</h2>
              {!editing ? (
                <button
                  type="button"
                  className="pf-link-btn"
                  onClick={() => {
                    setFields(current);
                    setSaved(null);
                    setEditing(true);
                  }}
                >
                  <Pencil size={14} aria-hidden="true" /> Edit
                </button>
              ) : null}
            </div>

            {editing ? (
              <form
                className="pf-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (valid && !save.isPending) save.mutate(fields);
                }}
              >
                <fieldset disabled={save.isPending}>
                  <label className="pf-label" htmlFor="pf-fullname">
                    Name
                  </label>
                  <input
                    id="pf-fullname"
                    className="pf-input"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={fields.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                  <p className="pf-label">Role</p>
                  <Choices
                    label="Role"
                    options={DX_ROLES}
                    value={fields.role}
                    onChange={(v) => set("role", v)}
                  />
                  <p className="pf-label">Team size</p>
                  <Choices
                    label="Team size"
                    options={DX_TEAM_SIZES}
                    value={fields.teamSize}
                    onChange={(v) => set("teamSize", v)}
                  />
                  <p className="pf-label">Main goal</p>
                  <Choices
                    label="Main goal"
                    options={DX_GOALS}
                    value={fields.goal}
                    onChange={(v) => set("goal", v)}
                  />
                </fieldset>
                {error ? (
                  <p className="pf-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="pf-actions">
                  <button
                    type="button"
                    className="pf-btn"
                    disabled={save.isPending}
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="pf-btn pf-btn-primary"
                    disabled={!valid || save.isPending}
                  >
                    {save.isPending ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="pf-facts">
                <div>
                  <dt>Name</dt>
                  <dd>{current.fullName || "—"}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{current.role || "—"}</dd>
                </div>
                <div>
                  <dt>Team size</dt>
                  <dd>{current.teamSize || "—"}</dd>
                </div>
                <div>
                  <dt>Main goal</dt>
                  <dd>{current.goal || "—"}</dd>
                </div>
              </dl>
            )}
            <p className="pf-status" role="status">
              {saved ?? ""}
            </p>
          </section>

          <div className="pf-side">
            <section className="pf-card" aria-labelledby="pf-prefs">
              <h2 id="pf-prefs">Preferences</h2>
              <ExplainSwitch />
              <p className="pf-muted">
                Shows why each step matters as you work. Saved on this browser.
              </p>
            </section>

            <section className="pf-card" aria-labelledby="pf-account">
              <h2 id="pf-account">Account</h2>
              <dl className="pf-facts">
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
              </dl>
              <div className="pf-account-links">
                <Link to="/privacy" className="pf-link">
                  Privacy policy
                </Link>
                <button type="button" className="pf-btn" onClick={() => void signOut()}>
                  <LogOut size={14} aria-hidden="true" /> Sign out
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
