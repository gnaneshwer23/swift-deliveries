import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { buildStudioInbox } from "@/lib/pilot-mission/studio-inbox";
import { StudioWelcomeDashboard } from "@/components/command/studio-welcome-dashboard";
import { StudioIdeaDashboard } from "@/components/command/studio-idea-dashboard";
import { StudioClarifyingDashboard } from "@/components/command/studio-clarifying-dashboard";
import "@/styles/studio-entry-dashboard.css";

const WELCOME_SEEN_KEY = "dx-studio-entry-welcome-seen";
const ENTRY_SCREEN_KEY = "dx-studio-entry-screen";

type EntryScreen = "welcome" | "idea" | "clarify";

function readEntryScreen(): EntryScreen {
  if (typeof window === "undefined") return "welcome";
  const stored = window.sessionStorage.getItem(ENTRY_SCREEN_KEY);
  if (stored === "clarify" || stored === "idea" || stored === "welcome") return stored;
  return window.sessionStorage.getItem(WELCOME_SEEN_KEY) === "1" ? "idea" : "welcome";
}

/**
 * Studio entry: Welcome → Idea submission (3) → Clarifying questions (4).
 */
export function InvestigationStudioFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.ready ? home.data.missions : [];
  const inbox = buildStudioInbox(missions);
  const current = inbox[0] ?? null;

  const recent = missions
    .filter((m) => !m.archived)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 8);

  const [screen, setScreenState] = useState<EntryScreen>(() => readEntryScreen());

  const setScreen = useCallback((next: EntryScreen) => {
    setScreenState(next);
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

  useEffect(() => {
    if (recent.length > 0 && screen === "welcome") {
      setScreen("idea");
    }
  }, [recent.length, screen, setScreen]);

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
  const goWelcome = useCallback(() => setScreen("welcome"), [setScreen]);

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

  if (screen === "welcome") {
    return <StudioWelcomeDashboard onContinue={goIdea} />;
  }

  if (screen === "clarify") {
    return <StudioClarifyingDashboard onBackToIdea={goIdea} />;
  }

  return (
    <StudioIdeaDashboard
      missions={missions}
      recent={recent}
      current={current}
      allowanceLine={allowanceLine}
      onBackToWelcome={goWelcome}
      onContinueToClarifying={goClarify}
    />
  );
}
