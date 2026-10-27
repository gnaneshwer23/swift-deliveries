/**
 * The voice session as the panel sees it: connect, talk, send, reconnect,
 * stop. It knows nothing about missions, so nothing it does (dropping,
 * reconnecting, stopping, interrupting) can change one. A finished transcript
 * is handed to the panel, which sends it down the same path as typed text.
 * The connection itself is injected, so all of this is testable without a
 * browser or a provider.
 */

export type VoicePhase =
  "off" | "connecting" | "ready" | "listening" | "transcribing" | "reconnecting" | "failed";

export type VoiceConnection = {
  /** Opens the microphone for one turn; nothing is sent before this. */
  startTurn(): void;
  /** Closes the microphone and asks for the turn's final transcript. */
  endTurn(): void;
  close(): void;
};

export type VoiceHandlers = {
  onTranscript(text: string): void;
  onPartial(text: string): void;
  onDrop(): void;
  onError(message: string): void;
};

export type Connector = (handlers: VoiceHandlers) => Promise<VoiceConnection>;

export type VoiceLinkOptions = {
  onPhase(phase: VoicePhase): void;
  /** The final transcript of one turn, ready to send like typed text. */
  onTranscript(text: string): void;
  onPartial?(text: string): void;
  onNotice(message: string): void;
  maxReconnects?: number;
  /** Milliseconds before reconnect attempt n (1-based). */
  backoff?(attempt: number): number;
  /** Give up on a turn's transcript after this long. */
  transcriptTimeoutMs?: number;
  sleep?(ms: number): Promise<void>;
  setTimer?(fn: () => void, ms: number): () => void;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const defaultTimer = (fn: () => void, ms: number) => {
  const t = setTimeout(fn, ms);
  return () => clearTimeout(t);
};

export class VoiceLink {
  private phase: VoicePhase = "off";
  private conn: VoiceConnection | null = null;
  /** Bumped on every (re)connect and on stop, so stale callbacks are ignored. */
  private generation = 0;
  private cancelTimeout: (() => void) | null = null;

  constructor(
    private readonly connect: Connector,
    private readonly opts: VoiceLinkOptions,
  ) {}

  get current(): VoicePhase {
    return this.phase;
  }

  private set(phase: VoicePhase) {
    this.phase = phase;
    this.opts.onPhase(phase);
  }

  private clearTimeout() {
    this.cancelTimeout?.();
    this.cancelTimeout = null;
  }

  private async open(generation: number): Promise<VoiceConnection> {
    const conn = await this.connect({
      onTranscript: (text) => {
        if (generation !== this.generation || this.phase !== "transcribing") return;
        this.clearTimeout();
        this.set("ready");
        const said = text.trim();
        if (said) this.opts.onTranscript(said);
        else this.opts.onNotice("I didn't catch anything. Try again, or type instead.");
      },
      onPartial: (text) => {
        if (generation === this.generation) this.opts.onPartial?.(text);
      },
      onDrop: () => {
        if (generation === this.generation) void this.reconnect();
      },
      onError: (message) => {
        if (generation === this.generation) this.opts.onNotice(message);
      },
    });
    if (generation !== this.generation) {
      // Stopped (or replaced) while connecting: never keep a stray microphone open.
      conn.close();
      throw new Error("stale");
    }
    return conn;
  }

  async start(): Promise<void> {
    if (this.phase !== "off" && this.phase !== "failed") return;
    const generation = ++this.generation;
    this.set("connecting");
    try {
      this.conn = await this.open(generation);
      this.set("ready");
    } catch (e) {
      if (generation !== this.generation) return;
      this.set("failed");
      this.opts.onNotice(
        e instanceof Error && e.message !== "stale" ? e.message : "Voice could not start.",
      );
    }
  }

  /** Push-to-talk: open the microphone for one turn. */
  talk(): void {
    if (this.phase !== "ready" || !this.conn) return;
    this.conn.startTurn();
    this.set("listening");
  }

  /** End the turn and wait for its transcript. */
  send(): void {
    if (this.phase !== "listening" || !this.conn) return;
    this.conn.endTurn();
    this.set("transcribing");
    const generation = this.generation;
    this.cancelTimeout = (this.opts.setTimer ?? defaultTimer)(() => {
      if (generation !== this.generation || this.phase !== "transcribing") return;
      this.set("ready");
      this.opts.onNotice("The transcript didn't arrive. Say it again, or type instead.");
    }, this.opts.transcriptTimeoutMs ?? 15_000);
  }

  private async reconnect(): Promise<void> {
    if (this.phase === "off" || this.phase === "reconnecting") return;
    const lostTurn = this.phase === "listening" || this.phase === "transcribing";
    this.clearTimeout();
    // A new generation first, so the old connection's own close events are ignored.
    const generation = ++this.generation;
    this.set("reconnecting");
    this.conn?.close();
    this.conn = null;
    if (lostTurn)
      this.opts.onNotice("The connection dropped mid-sentence. Say it again once it's back.");
    const max = this.opts.maxReconnects ?? 3;
    for (let attempt = 1; attempt <= max; attempt++) {
      await (this.opts.sleep ?? defaultSleep)(this.opts.backoff?.(attempt) ?? attempt * 1000);
      if (generation !== this.generation) return;
      try {
        this.conn = await this.open(generation);
        this.set("ready");
        return;
      } catch {
        if (generation !== this.generation) return;
      }
    }
    this.set("failed");
    this.opts.onNotice(
      "Voice couldn't reconnect. Your conversation is safe; type, or turn voice on again.",
    );
  }

  /** Ends the voice session. The conversation and every mission are left as they are. */
  stop(): void {
    this.generation++;
    this.clearTimeout();
    this.conn?.close();
    this.conn = null;
    this.set("off");
  }
}
