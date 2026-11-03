import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, hash }: { children: ReactNode; to: string; hash?: string }) => (
    <a href={hash ? `${to}#${hash}` : to}>{children}</a>
  ),
}));
// Any call to a project server function fails the test: the sample must never make one.
vi.mock(
  "@/lib/pilot-mission.functions",
  () =>
    new Proxy(
      {},
      {
        get: (_t, name) => () => {
          throw new Error(`sample called server function ${String(name)}`);
        },
      },
    ),
);

describe("SampleProjectView", () => {
  it("renders the labelled sample and makes no network calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { SampleProjectView } = await import("./sample-project-view");
    const html = renderToStaticMarkup(<SampleProjectView />);
    expect(html).toMatch(/role="note"[^>]*>.*invented/s);
    expect(html).toContain("Checkpoint");
    expect(html).toContain("Waiting on you");
    expect(html).toContain("Team’s recommendation");
    // Opens the new-project form, like the other "new project" links.
    expect(html).toContain('href="/command#new-project"');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
