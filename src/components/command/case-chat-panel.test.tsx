import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { baseMission } from "@/lib/pilot-mission/test-fixtures";

vi.mock("@/styles/mission-dashboard-screen.css", () => ({}));
const { CaseChatPanel } = await import("./case-chat-panel");
const { MissionDashboardScreen } = await import("./mission-dashboard-screen");

const clean = (html: string) => html.replaceAll("<!-- -->", "").replaceAll("&#x27;", "'");

describe("CaseChatPanel", () => {
  it("offers the suggested questions and says it is read-only", () => {
    const html = clean(
      renderToString(
        <CaseChatPanel
          mission={baseMission()}
          helperText="Ask about this case."
          suggestedPrompts={["What is waiting on me?"]}
        />,
      ),
    );
    expect(html).toContain(">What is waiting on me?</button>");
    expect(html).toContain("chat cannot approve or change the case");
    expect(html).not.toContain("Start a conversation");
  });
});

describe("MissionDashboardScreen", () => {
  it("states each rail stage in words, not by colour alone", () => {
    const html = clean(
      renderToString(
        <MissionDashboardScreen
          mission={baseMission({ stage: "exported" as never, exportBody: "# Pack\n" })}
        />,
      ),
    );
    expect(html).toMatch(/data-state="done">Handover<span class="mdash-rail-state">Done</);
    expect(html).toMatch(
      /data-state="skipped">Design<span class="mdash-rail-state">Not done on this path</,
    );
  });
});
