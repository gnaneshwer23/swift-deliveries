import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { StudioWelcomeDashboard } from "@/components/command/studio-welcome-dashboard";
import { StudioIdeaDashboard } from "@/components/command/studio-idea-dashboard";
import { StudioClarifyingDashboard } from "@/components/command/studio-clarifying-dashboard";
import { ProjectsDashboard } from "@/components/command/projects-dashboard";
import "@/styles/studio-entry-dashboard.css";

const WELCOME_SEEN_KEY = "dx-studio-entry-welcome-seen";
const ENTRY_SCREEN_KEY = "dx-studio-entry-screen";

type EntryScreen = "projects" | "welcome" | "idea" | "clarify";

/** Only a half-finished new project survives a reload; otherwise the home picks the screen. */
function readEntryScreen(): EntryScreen | null {
  if (typeof window === "undefined") return null;
  if (/^#(new-project|supervised-brief)$/.test(window.location.hash)) return "idea";
  const stored = window.sessionStorage.getItem(ENTRY_SCREEN_KEY);
  return stored === "clarify" ? stored : null;
}

function welcomeSeen(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(WELCOME_SEEN_KEY) === "1";
}

/**
 * Studio home: the projects dashboard once you have a project; otherwise
 * Welcome → Idea → Clarifying questions. "New project" opens the same idea flow.
 */
export function InvestigationStudioFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.ready ? home.data.missions : [];

  const [chosen, setChosen] = useState<EntryScreen | null>(() => readEntryScreen());
  const screen: EntryScreen =
    chosen ?? (missions.length > 0 ? "projects" : welcomeSeen() ? "idea" : "welcome");

  const setScreen = useCallback((next: EntryScreen) => {
    setChosen(next);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(ENTRY_SCREEN_KEY, next);
      if (next !== "welcome") {
        window.sessionStorage.setItem(WELCOME_SEEN_KEY, "1");
      }
    } catch {
      /* Optional. */
    }
  }, []);

  const allowanceLine = (() => {
    if (!home.data?.ready) return null;
    if (home.data.investigationAllowanceLoad === "failed") {
      return home.data.investigationAllowanceLoadReason ?? "Allowance could not be loaded.";
    }
    if (home.data.investigationAllowance) {
      const n = home.data.investigationAllowance.remaining;
      return `${n} Investigation${n === 1 ? "" : "s"} remaining on your plan.`;
    }
    if (home.data.usage) {
      const left = Math.max(0, home.data.usage.ceiling - home.data.usage.consumed);
      return `Demo ceiling: ${left} of ${home.data.usage.ceiling} units.`;
    }
    return "Demo mode — no paid Investigation pilot on this workspace.";
  })();

  const goIdea = useCallback(() => setScreen("idea"), [setScreen]);
  const goClarify = useCallback(() => setScreen("clarify"), [setScreen]);
  const goProjects = useCallback(() => setScreen("projects"), [setScreen]);

  if (home.isPending) {
    return (
      <div className="sd-shell" role="status">
        <p className="sd-empty">Opening Studio…</p>
      </div>
    );
  }

  if (home.isError || (home.data && !home.data.ready)) {
    return (
      <div className="sd-shell" role="alert">
        <section className="sd-card">
          <p className="sd-brand">DeliverX Studio</p>
          <h1>Saved work could not load</h1>
          <p className="sd-lede">{home.data?.reason || "Check your connection and try again."}</p>
          <button
            type="button"
            className="sd-btn sd-btn-primary"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </section>
      </div>
    );
  }

  if (screen === "projects") {
    return (
      <ProjectsDashboard
        projects={missions}
        usage={home.data?.ready ? home.data.usage : null}
        allowanceLine={allowanceLine}
        onNewProject={goIdea}
      />
    );
  }

  if (screen === "welcome") {
    return <StudioWelcomeDashboard onContinue={goIdea} />;
  }

  if (screen === "clarify") {
    return <StudioClarifyingDashboard onBackToIdea={goIdea} />;
  }

  return (
    <StudioIdeaDashboard
      allowanceLine={missions.length ? null : allowanceLine}
      {...(missions.length ? { onBack: goProjects } : {})}
      onContinueToClarifying={goClarify}
    />
  );
}
