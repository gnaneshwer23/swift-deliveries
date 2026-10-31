import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { baseMission } from "@/lib/pilot-mission/test-fixtures";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

vi.mock("@/styles/studio-system.css", () => ({}));
// The advanced dossier and the step bodies have their own tests; this one is about the shell.
vi.mock("@/components/command/indigo-case-studio-shell", () => ({
  IndigoCaseStudioShell: () => null,
}));
vi.mock("@/components/command/investigation-team-formation", () => ({
  InvestigationTeamFormation: () => <p>team-formation</p>,
}));
vi.mock("@/components/command/investigation-scope-review", () => ({
  InvestigationScopeReview: () => <p>scope-review</p>,
}));
const { InvestigationStageShell } = await import("./investigation-stage-shell");

const render = (mission: SupervisedMission) =>
  renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <InvestigationStageShell
        mission={mission}
        missionId={mission.id}
        recordHash=""
        theatre={null}
        downloadsSlot={null}
        onDone={async () => undefined}
        onError={() => undefined}
      />
    </QueryClientProvider>,
  ).replaceAll("<!-- -->", "");

describe("case page shell", () => {
  it("shows the four-step decision path until a decision is recorded", () => {
    const html = render(baseMission({ approval: null, continuationPlan: null }));
    expect(html).toContain("Decision path");
    expect(html).toMatch(/aria-label="Decision path"/);
    expect(html.match(/<li[^>]*><button/g)).toHaveLength(4);
    expect(html).not.toContain('aria-label="Case sections"');
  });

  it("opens the case workspace after the decision, on the team until delivery starts", () => {
    const html = render(baseMission());
    expect(html).toContain("Case workspace");
    for (const label of [
      "Overview",
      "Team",
      "Timeline",
      "Evidence &amp; decisions",
      "Package",
      "Ask Aria",
      "Decision path",
    ]) {
      expect(html, label).toContain(`<span>${label}</span>`);
    }
    expect(html).toMatch(/aria-current="page"[^>]*><span>Team<\/span>/);
    expect(html).toContain("team-formation");
  });

  it("states what waits on the owner in words, in the header", () => {
    const html = render(baseMission({ stage: "alternatives" }));
    expect(html).toMatch(/data-state="waiting">1 waiting on you/);
  });
});
