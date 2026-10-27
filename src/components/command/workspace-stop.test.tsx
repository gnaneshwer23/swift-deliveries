import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/workforce.functions", () => ({ setWorkspaceStopped: vi.fn() }));
vi.mock("@/styles/mission-activity.css", () => ({}));
const { WorkspaceStopControl } = await import("./workspace-stop");

const render = (workspace: { stoppedAt: string | null; stopReason: string | null }) =>
  renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceStopControl workspace={workspace} />
    </QueryClientProvider>,
  );

describe("WorkspaceStopControl", () => {
  it("offers an emergency stop while work is allowed", () => {
    const html = render({ stoppedAt: null, stopReason: null });
    expect(html).toContain("Emergency stop");
    expect(html).not.toContain("All work is stopped");
  });

  it("says work is stopped, with the reason, and offers to continue", () => {
    const html = render({ stoppedAt: "2026-10-27T06:00:00Z", stopReason: "Checking costs" });
    expect(html).toContain("All work is stopped.");
    expect(html).toContain("Reason: Checking costs");
    expect(html).toContain("Let work continue");
    expect(html).toContain('role="status"');
  });
});
