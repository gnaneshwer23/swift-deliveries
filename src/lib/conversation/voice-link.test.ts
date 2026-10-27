import { describe, expect, it, vi } from "vitest";
import { VoiceLink, type Connector, type VoiceHandlers, type VoicePhase } from "./voice-link";

/** A fake provider connection the test can drive: transcripts, drops and failures. */
function fakeProvider() {
  const handlers: VoiceHandlers[] = [];
  const calls: string[] = [];
  const connect: Connector = async (h) => {
    handlers.push(h);
    const n = handlers.length;
    return {
      startTurn: async () => {
        calls.push(`talk#${n}`);
      },
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
    await v.talk();
    v.send();
    p.last().onPartial("Investigate why");
    p.last().onTranscript("  Investigate why parents drop off  ");
    expect(said).toEqual(["Investigate why parents drop off"]);
    expect(phases).toEqual(["connecting", "ready", "listening", "transcribing", "ready"]);
    expect(p.calls).toEqual(["talk#1", "send#1"]);
  });

  it("opens the microphone only once the provider is ready for the turn", async () => {
    let cleared!: () => void;
    const connect: Connector = async () => ({
      startTurn: () => new Promise<void>((r) => (cleared = r)),
      endTurn() {},
      close() {},
    });
    const { v } = link(connect);
    await v.start();
    const talking = v.talk();
    void v.talk(); // a second press while starting does nothing
    expect(v.current).toBe("ready");
    cleared();
    await talking;
    expect(v.current).toBe("listening");
  });

  it("says so when the microphone can't open for a turn, and stays ready", async () => {
    const connect: Connector = async () => ({
      startTurn: async () => {
        throw new Error("track ended");
      },
      endTurn() {},
      close() {},
    });
    const { v, notices } = link(connect);
    await v.start();
    await v.talk();
    expect(v.current).toBe("ready");
    expect(notices).toEqual(["The microphone couldn't open. Try again, or type instead."]);
  });

  it("ignores a transcript nobody asked for", async () => {
    const p = fakeProvider();
    const { v, said } = link(p.connect);
    await v.start();
    p.last().onTranscript("stray words");
    expect(said).toEqual([]);
  });

  it("says so when nothing was caught, or the provider couldn't transcribe", async () => {
    const p = fakeProvider();
    const { v, notices } = link(p.connect);
    await v.start();
    await v.talk();
    v.send();
    p.last().onTranscript("   ");
    await v.talk();
    v.send();
    p.last().onTranscriptFailed("The voice provider couldn't transcribe that.");
    expect(v.current).toBe("ready");
    expect(notices).toEqual([
      "I didn't catch anything. Try again, or type instead.",
      "The voice provider couldn't transcribe that. Say it again, or type instead.",
    ]);
  });

  it("retires the connection when a transcript times out, so a late one can't pass as the next turn", async () => {
    const p = fakeProvider();
    const { v, notices, said, timeout } = link(p.connect);
    await v.start();
    await v.talk();
    v.send();
    timeout();
    await vi.waitFor(() => expect(v.current).toBe("ready"));
    expect(notices).toEqual(["The transcript didn't arrive. Say it again, or type instead."]);
    expect(p.handlers).toHaveLength(2);
    // The next turn is in flight on the new connection; the old one's late transcript is ignored.
    await v.talk();
    v.send();
    p.handlers[0]!.onTranscript("words from the timed-out turn");
    expect(said).toEqual([]);
    p.handlers[1]!.onTranscript("Pause it");
    expect(said).toEqual(["Pause it"]);
  });

  it("reconnects after a dropped connection, and says a turn in flight was lost", async () => {
    const p = fakeProvider();
    const { v, phases, notices, said } = link(p.connect);
    await v.start();
    await v.talk();
    p.last().onDrop();
    await vi.waitFor(() => expect(v.current).toBe("ready"));
    expect(phases).toEqual(["connecting", "ready", "listening", "reconnecting", "ready"]);
    expect(notices).toEqual(["The connection dropped mid-sentence. Say it again once it's back."]);
    // With a new turn transcribing, only the generation check can reject the old connection's event.
    await v.talk();
    v.send();
    p.handlers[0]!.onTranscript("late words");
    expect(said).toEqual([]);
    p.last().onTranscript("Pause it");
    expect(said).toEqual(["Pause it"]);
    expect(p.calls.filter((c) => c.startsWith("close"))).toEqual(["close#1"]);
  });

  it("gives up on a connection that keeps dropping, until a turn completes", async () => {
    const p = fakeProvider();
    const { v, notices } = link(p.connect, { maxReconnects: 2 });
    await v.start();
    for (let i = 0; i < 2; i++) {
      p.last().onDrop();
      await vi.waitFor(() => expect(v.current).toBe("ready"));
    }
    p.last().onDrop();
    await vi.waitFor(() => expect(v.current).toBe("failed"));
    expect(p.handlers).toHaveLength(3);
    expect(notices.at(-1)).toMatch(/couldn't reconnect\. Your conversation is safe/);
  });

  it("fails cleanly after repeated reconnect failures", async () => {
    let n = 0;
    const handlers: VoiceHandlers[] = [];
    const connect: Connector = async (h) => {
      n++;
      if (n > 1) throw new Error("down");
      handlers.push(h);
      return { startTurn: async () => {}, endTurn() {}, close() {} };
    };
    const { v, notices } = link(connect, { maxReconnects: 2 });
    await v.start();
    handlers[0]!.onDrop();
    await vi.waitFor(() => expect(v.current).toBe("failed"));
    expect(n).toBe(3);
    expect(notices.at(-1)).toMatch(/couldn't reconnect\. Your conversation is safe/);
  });

  it("reports a session that cannot start, so typing carries on", async () => {
    const { v, notices } = link(async () => {
      throw new Error("down");
    });
    await v.start();
    expect(v.current).toBe("failed");
    expect(notices).toEqual(["down"]);
  });

  it("cancels setup when voice is turned off mid-connect, and closes anything it opened", async () => {
    let release!: () => void;
    let aborted = false;
    const closed: string[] = [];
    const connect: Connector = (_h, signal) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => (aborted = true));
        release = () =>
          resolve({ startTurn: async () => {}, endTurn() {}, close: () => closed.push("closed") });
      });
    const { v } = link(connect);
    const starting = v.start();
    v.stop();
    expect(aborted).toBe(true);
    release();
    await starting;
    expect(v.current).toBe("off");
    expect(closed).toEqual(["closed"]);
  });

  it("stopping mid-turn only closes the connection; it reaches nothing else", async () => {
    const p = fakeProvider();
    const { v, said, phases } = link(p.connect);
    await v.start();
    await v.talk();
    v.stop();
    p.last().onTranscript("cancel the mission");
    expect(p.calls).toEqual(["talk#1", "close#1"]);
    expect(said).toEqual([]);
    expect(phases.at(-1)).toBe("off");
  });
});
