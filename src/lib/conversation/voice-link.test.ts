import { describe, expect, it, vi } from "vitest";
import { VoiceLink, type Connector, type VoiceHandlers, type VoicePhase } from "./voice-link";

/** A fake provider connection the test can drive: transcripts, drops and failures. */
function fakeProvider(failures = 0) {
  const handlers: VoiceHandlers[] = [];
  const calls: string[] = [];
  let toFail = failures;
  const connect: Connector = async (h) => {
    if (toFail-- > 0) throw new Error("network down");
    handlers.push(h);
    const n = handlers.length;
    return {
      startTurn: () => calls.push(`talk#${n}`),
      endTurn: () => calls.push(`send#${n}`),
      close: () => {
        calls.push(`close#${n}`);
        h.onDrop(); // a real channel reports its own close; it must be ignored
      },
    };
  };
  return { connect, handlers, calls, last: () => handlers.at(-1)! };
}

function link(connect: Connector, extra: Partial<ConstructorParameters<typeof VoiceLink>[1]> = {}) {
  const phases: VoicePhase[] = [];
  const said: string[] = [];
  const notices: string[] = [];
  let fire: (() => void) | null = null;
  const v = new VoiceLink(connect, {
    onPhase: (p) => phases.push(p),
    onTranscript: (t) => said.push(t),
    onNotice: (n) => notices.push(n),
    sleep: async () => {},
    setTimer: (fn) => {
      fire = fn;
      return () => (fire = null);
    },
    ...extra,
  });
  return { v, phases, said, notices, timeout: () => fire?.() };
}

describe("voice session", () => {
  it("sends nothing before Talk, and hands over the turn's final transcript", async () => {
    const p = fakeProvider();
    const { v, said, phases } = link(p.connect);
    await v.start();
    expect(p.calls).toEqual([]);
    v.talk();
    v.send();
    p.last().onPartial("Investigate why");
    p.last().onTranscript("  Investigate why parents drop off  ");
    expect(said).toEqual(["Investigate why parents drop off"]);
    expect(phases).toEqual(["connecting", "ready", "listening", "transcribing", "ready"]);
    expect(p.calls).toEqual(["talk#1", "send#1"]);
  });

  it("ignores a transcript nobody asked for", async () => {
    const p = fakeProvider();
    const { v, said } = link(p.connect);
    await v.start();
    p.last().onTranscript("stray words");
    expect(said).toEqual([]);
  });

  it("says so when nothing was caught, or the transcript never arrives", async () => {
    const p = fakeProvider();
    const { v, notices, timeout } = link(p.connect);
    await v.start();
    v.talk();
    v.send();
    p.last().onTranscript("   ");
    expect(notices).toEqual(["I didn't catch anything. Try again, or type instead."]);
    v.talk();
    v.send();
    timeout();
    expect(v.current).toBe("ready");
    expect(notices.at(-1)).toMatch(/didn't arrive/);
  });

  it("reconnects after a dropped connection, and says a turn in flight was lost", async () => {
    const p = fakeProvider();
    const { v, phases, notices, said } = link(p.connect);
    await v.start();
    v.talk();
    p.last().onDrop();
    await vi.waitFor(() => expect(v.current).toBe("ready"));
    expect(phases).toEqual(["connecting", "ready", "listening", "reconnecting", "ready"]);
    expect(notices).toEqual(["The connection dropped mid-sentence. Say it again once it's back."]);
    // The old connection is closed once, and its late transcript is ignored.
    p.handlers[0]!.onTranscript("late words");
    expect(said).toEqual([]);
    v.talk();
    v.send();
    p.last().onTranscript("Pause it");
    expect(said).toEqual(["Pause it"]);
    expect(p.calls.filter((c) => c.startsWith("close"))).toEqual(["close#1"]);
  });

  it("reports a session that cannot start, so typing carries on", async () => {
    const { v, notices } = link(async () => {
      throw new Error("down");
    });
    await v.start();
    expect(v.current).toBe("failed");
    expect(notices).toEqual(["down"]);
  });

  it("fails cleanly after repeated reconnect failures", async () => {
    let n = 0;
    const handlers: VoiceHandlers[] = [];
    const connect: Connector = async (h) => {
      n++;
      if (n > 1) throw new Error("down");
      handlers.push(h);
      return { startTurn() {}, endTurn() {}, close() {} };
    };
    const { v, notices } = link(connect, { maxReconnects: 2 });
    await v.start();
    handlers[0]!.onDrop();
    await vi.waitFor(() => expect(v.current).toBe("failed"));
    expect(n).toBe(3);
    expect(notices.at(-1)).toMatch(/couldn't reconnect\. Your conversation is safe/);
  });

  it("stops without leaving a microphone open, even mid-connect", async () => {
    let release!: () => void;
    const closed: string[] = [];
    const connect: Connector = () =>
      new Promise((resolve) => {
        release = () =>
          resolve({ startTurn() {}, endTurn() {}, close: () => closed.push("closed") });
      });
    const { v } = link(connect);
    const starting = v.start();
    v.stop();
    release();
    await starting;
    expect(v.current).toBe("off");
    expect(closed).toEqual(["closed"]);
  });

  it("knows nothing of missions: stopping and interrupting only end the session", async () => {
    // The link's whole surface: none of it can reach a mission.
    const surface = Object.getOwnPropertyNames(VoiceLink.prototype).filter(
      (k) => k !== "constructor",
    );
    expect(surface.sort()).toEqual(
      [
        "clearTimeout",
        "current",
        "open",
        "reconnect",
        "send",
        "set",
        "start",
        "stop",
        "talk",
      ].sort(),
    );
  });
});
