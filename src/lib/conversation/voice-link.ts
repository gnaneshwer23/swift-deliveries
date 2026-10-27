/**
 * The voice session as the panel sees it: connect, talk, send, reconnect,
 * stop. It knows nothing about missions, so nothing it does (dropping,
 * reconnecting, stopping) can change one. A finished transcript is handed to
 * the panel, which sends it down the same path as typed text. The connection
 * itself is injected, so all of this is testable without a browser or a
 * provider.
 */

export type VoicePhase =
  "off" | "connecting" | "ready" | "listening" | "transcribing" | "reconnecting" | "failed";

export type VoiceConnection = {
  /**
   * Opens the microphone for one turn, once the provider has cleared what came
   * before; nothing is sent before this.
   */
  startTurn(): Promise<void>;
  /** Closes the microphone and asks for the turn's final transcript. */
  endTurn(): void;
  close(): void;
};

export type VoiceHandlers = {
  onTranscript(text: string): void;
  /** The provider could not transcribe the committed turn. */
  onTranscriptFailed(message: string): void;
  onPartial(text: string): void;
  onDrop(): void;
  onError(message: string): void;
};

/** Opens a connection. Setup must stop, and release the microphone, once `signal` aborts. */
export type Connector = (handlers: VoiceHandlers, signal: AbortSignal) => Promise<VoiceConnection>;

export type VoiceLinkOptions = {
  onPhase(phase: VoicePhase): void;
  /** The final transcript of one turn, ready to send like typed text. */
  onTranscript(text: string): void;
  onPartial?(text: string): void;
  onNotice(message: string): void;
  /** Reconnect attempts allowed between two completed turns. */
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
  private setup: AbortController | null = null;
  private cancelTimeout: (() => void) | null = null;
  /** Reconnects used since the last completed turn: a connection that keeps dropping gives up. */
  private reconnectsUsed = 0;
  private starting = false;

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

  /** Retires the current connection: its late events are ignored and its setup is cancelled. */
  private retire(): number {
    const generation = ++this.generation;
    this.clearTimeout();
    this.setup?.abort();
    this.setup = null;
    this.conn?.close();
    this.conn = null;
    this.starting = false;
    return generation;
  }

  private turnEnded(generation: number) {
    if (generation !== this.generation || this.phase !== "transcribing") return false;
    this.clearTimeout();
    this.set("ready");
    return true;
  }

  private async open(generation: number): Promise<VoiceConnection> {
    const setup = new AbortController();
    this.setup = setup;
    const conn = await this.connect(
      {
        onTranscript: (text) => {
          if (!this.turnEnded(generation)) return;
          this.reconnectsUsed = 0;
          const said = text.trim();
          if (said) this.opts.onTranscript(said);
          else this.opts.onNotice("I didn't catch anything. Try again, or type instead.");
        },
        onTranscriptFailed: (message) => {
          if (this.turnEnded(generation))
            this.opts.onNotice(`${message} Say it again, or type instead.`);
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
      },
      setup.signal,
    );
    if (generation !== this.generation || setup.signal.aborted) {
      // Stopped (or replaced) while connecting: never keep a stray microphone open.
      conn.close();
      throw new Error("stale");
    }
    this.setup = null;
    return conn;
  }

  async start(): Promise<void> {
    if (this.phase !== "off" && this.phase !== "failed") return;
    const generation = this.retire();
    this.reconnectsUsed = 0;
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

  /** Push-to-talk: open the microphone for one turn, once the provider is ready for it. */
  async talk(): Promise<void> {
    if (this.phase !== "ready" || !this.conn || this.starting) return;
    const generation = this.generation;
    this.starting = true;
    try {
      await this.conn.startTurn();
    } catch {
      if (generation === this.generation)
        this.opts.onNotice("The microphone couldn't open. Try again, or type instead.");
      return;
    } finally {
      if (generation === this.generation) this.starting = false;
    }
    if (generation === this.generation && this.phase === "ready") this.set("listening");
  }

  /** End the turn and wait for its transcript. */
  send(): void {
    if (this.phase !== "listening" || !this.conn) return;
    this.conn.endTurn();
    this.set("transcribing");
    const generation = this.generation;
    this.cancelTimeout = (this.opts.setTimer ?? defaultTimer)(() => {
      if (generation !== this.generation || this.phase !== "transcribing") return;
      this.opts.onNotice("The transcript didn't arrive. Say it again, or type instead.");
      // A fresh connection, so a late transcript of this turn can never pass as the next one.
      void this.reconnect(true);
    }, this.opts.transcriptTimeoutMs ?? 15_000);
  }

  private async reconnect(afterTimeout = false): Promise<void> {
    if (this.phase === "off" || this.phase === "reconnecting") return;
    const lostTurn = !afterTimeout && (this.phase === "listening" || this.phase === "transcribing");
    // A new generation first, so the old connection's own close events are ignored.
    const generation = this.retire();
    this.set("reconnecting");
    if (lostTurn)
      this.opts.onNotice("The connection dropped mid-sentence. Say it again once it's back.");
    const max = this.opts.maxReconnects ?? 3;
    while (this.reconnectsUsed < max) {
      const attempt = ++this.reconnectsUsed;
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

  /** Ends the voice session, cancelling any setup. The conversation and every mission are left as they are. */
  stop(): void {
    this.retire();
    this.set("off");
  }
}
