import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ariaDockStorageKey,
  readAriaDockMinimized,
  writeAriaDockMinimized,
} from "./room-dock-preference";
import { RoomDock, RoomDockView, type RoomDockAction } from "./room-dock";

const clean = (html: string) => html.replaceAll("<!-- -->", "");

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

const actions: RoomDockAction[] = [
  { id: "ask", label: "Ask Aria", onClick: () => undefined },
  { id: "meetings", label: "Meeting notes", count: 2, onClick: () => undefined },
  { id: "next", label: "Say what you expect to happen", primary: true, onClick: () => undefined },
];

describe("aria dock preference", () => {
  it("remembers minimize per mission id", () => {
    const storage = memoryStorage();
    expect(ariaDockStorageKey("mission-a")).toBe("dx-aria-dock-minimized:mission-a");
    expect(readAriaDockMinimized("mission-a", storage)).toBe(false);

    writeAriaDockMinimized("mission-a", true, storage);
    expect(readAriaDockMinimized("mission-a", storage)).toBe(true);
    expect(readAriaDockMinimized("mission-b", storage)).toBe(false);

    writeAriaDockMinimized("mission-a", false, storage);
    expect(storage.getItem(ariaDockStorageKey("mission-a"))).toBeNull();
  });

  it("ignores a missing store", () => {
    expect(readAriaDockMinimized("mission-a", null)).toBe(false);
    expect(() => writeAriaDockMinimized("mission-a", true, null)).not.toThrow();
  });
});

describe("RoomDockView", () => {
  it("offers minimize while the next step stays expanded", () => {
    const html = clean(
      renderToString(
        <RoomDockView
          minimized={false}
          onMinimizedChange={() => undefined}
          waiting
          statusLabel="Aria needs you"
          actions={actions}
          peekId="next"
          downloads={<p>Charter, PRD and other saved stage files download from the build.</p>}
        />,
      ),
    );
    expect(html).toContain('data-minimized="false"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain(">Minimize<");
    expect(html).toContain("Aria needs you");
    expect(html).toContain("Say what you expect to happen");
    expect(html).toContain("Ask Aria");
    expect(html).toContain('class="room-pill-count">2<');
    expect(html).not.toContain('id="room-dock-panel" hidden');
    const panelAt = html.indexOf('id="room-dock-panel"');
    const panel = html.slice(panelAt);
    expect(html.slice(0, panelAt)).not.toContain("Say what you expect to happen");
    const noteAt = panel.indexOf("Charter, PRD and other saved stage files");
    const ctaAt = panel.indexOf("Say what you expect to happen");
    expect(noteAt).toBeGreaterThan(-1);
    expect(ctaAt).toBeGreaterThan(noteAt);
  });

  it("keeps the waiting status and primary action on the minimized chip", () => {
    const html = clean(
      renderToString(
        <RoomDockView
          minimized
          onMinimizedChange={() => undefined}
          waiting
          statusLabel="Aria needs you"
          actions={actions}
          peekId="next"
          downloads={<p>Charter note</p>}
        />,
      ),
    );
    expect(html).toContain('data-minimized="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="room-dock-panel"');
    expect(html).toContain(">Expand<");
    const panelAt = html.indexOf('id="room-dock-panel"');
    const chip = html.slice(0, panelAt);
    const panel = html.slice(panelAt);
    expect(chip).toContain("Aria needs you");
    expect(chip).toContain("Say what you expect to happen");
    expect(chip).toContain("room-pill-primary");
    expect(chip).not.toContain("Ask Aria");
    expect(panel).toContain("hidden");
    expect(panel).toContain("Ask Aria");
    expect(panel).toContain("Charter note");
  });
});

describe("RoomDock", () => {
  it("renders expanded before the saved preference is read", () => {
    const html = clean(
      renderToString(
        <RoomDock
          missionId="mission-a"
          waiting={false}
          statusLabel="The team is building"
          actions={actions.slice(0, 1)}
        />,
      ),
    );
    expect(html).toContain('data-minimized="false"');
    expect(html).toContain(">Minimize<");
    expect(html).toContain("The team is building");
  });
});
