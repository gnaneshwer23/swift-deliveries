/**
 * Settings → Connections: which outside services this deployment of DeliverX is set up to use,
 * and what your projects do without each one. Built from booleans and provider names only;
 * no key or secret value ever reaches this module.
 */

export type ConnectionStatus = "on" | "off" | "problem";

export type ConnectionRow = {
  id: "model" | "research" | "voice" | "listen" | "payments" | "scheduler" | "google";
  name: string;
  status: ConnectionStatus;
  /** Short status text, e.g. "On · tavily". */
  label: string;
  /** What this does for your projects. */
  what: string;
  /** What happens now, given the status. */
  now: string;
  /** A configuration problem, for whoever runs this deployment; names only, never values. */
  problem: string | null;
};

export type ConnectionsInput = {
  model: {
    enabled: boolean;
    provider: string | null;
    model: string | null;
    problem: string | null;
  };
  research: { configured: boolean; provider: string | null };
  voice: { enabled: boolean; problem: string | null };
  payments: { ok: true; environment: "live" | "sandbox" } | { ok: false; message: string };
  /** The checkout flag is on, so an error from `payments` is a real problem rather than "off". */
  checkoutFlagOn: boolean;
  /** The payments kill switch: a deliberate pause, not a fault. */
  paymentsKillSwitchOn: boolean;
  schedulerConfigured: boolean;
  googleSignIn: boolean;
};

export type ConnectionsSummary = {
  rows: ConnectionRow[];
  checkedAt: string;
  /** How the statuses were worked out, shown with the date (a claim states its method). */
  method: string;
};

export const CONNECTIONS_METHOD =
  "Read from this deployment's settings when you opened this page. It shows whether each service is set up; it does not make a test call to it.";

/** Your own accounts: DeliverX has no connectors to them, so nothing reads them. */
export const YOUR_ACCOUNTS_NOTE =
  "DeliverX does not connect to your email, calendar, chat, files or code accounts. Nothing reads them. Evidence reaches a project only when you paste or upload it.";

export function buildConnections(
  input: ConnectionsInput,
  now: number = Date.now(),
): ConnectionsSummary {
  const { model, research, voice, payments } = input;
  const rows: ConnectionRow[] = [
    {
      id: "model",
      name: "AI model drafting",
      status: model.problem ? "problem" : model.enabled ? "on" : "off",
      label: model.problem
        ? "Set up incorrectly"
        : model.enabled
          ? `On · ${model.model ?? model.provider ?? "configured"}`
          : "Off",
      what: "Writes briefs, plans and comparisons with an AI model. Each draft names the model that wrote it.",
      now: model.enabled
        ? "Drafts are written by the model named above and labelled with it."
        : "Drafts are simulated from templates and labelled “Simulated draft”. Nothing is sent to a model provider.",
      problem: model.problem,
    },
    {
      id: "research",
      name: "Web research",
      status: research.configured ? "on" : "off",
      label: research.configured ? `On · ${research.provider ?? "configured"}` : "Off",
      what: "Finds public sources for a project's questions and keeps each link with what it supports.",
      now: research.configured
        ? "Web and Combined research retrieve sources through the provider above."
        : "Projects use only the evidence you provide. Questions that need the web are recorded as gaps; no sources are invented.",
      problem: null,
    },
    {
      id: "voice",
      name: "Voice input",
      status: voice.problem && !voice.enabled ? "problem" : voice.enabled ? "on" : "off",
      label: voice.enabled ? "On" : voice.problem ? "Not set up" : "Off",
      what: "Talk instead of typing: your speech is turned into text in the conversation.",
      now: voice.enabled
        ? "Sound goes to the voice provider only between pressing Talk and Send, and the transcript is used as if you had typed it. DeliverX stores no audio; the provider may keep what it receives for a limited time under its own API data policy."
        : "Type instead. The microphone is never used.",
      problem: voice.enabled ? null : voice.problem,
    },
    {
      id: "listen",
      name: "Listen",
      status: "on",
      label: "On · this device",
      what: "Reads a brief aloud.",
      now: "Uses the speech built into your browser; DeliverX sends nothing to a speech service. Which voice is used, and whether it runs on the device or online, depends on your browser.",
      problem: null,
    },
    {
      id: "payments",
      name: "Card payments",
      // A kill-switch pause is deliberate, so it reads as off, not as a fault.
      status: payments.ok
        ? "on"
        : input.checkoutFlagOn && !input.paymentsKillSwitchOn
          ? "problem"
          : "off",
      label: payments.ok
        ? payments.environment === "live"
          ? "On · Stripe"
          : "Test mode · Stripe"
        : input.paymentsKillSwitchOn
          ? "Paused"
          : input.checkoutFlagOn
            ? "Set up incorrectly"
            : "Off",
      what: "Takes payment for a plan through Stripe's hosted checkout. DeliverX never sees card numbers.",
      now: payments.ok
        ? payments.environment === "live"
          ? "Paying for a plan charges your card through Stripe."
          : "Checkout runs in Stripe's test mode; no real card is charged."
        : "Checkout is not available, so nothing can be charged.",
      problem:
        payments.ok || input.paymentsKillSwitchOn || !input.checkoutFlagOn
          ? null
          : payments.message,
    },
    {
      id: "scheduler",
      name: "Background steps",
      status: input.schedulerConfigured ? "on" : "off",
      label: input.schedulerConfigured ? "On" : "Off",
      what: "Wakes approved work on a schedule and picks up steps that were interrupted.",
      now: input.schedulerConfigured
        ? "Approved steps keep moving while you are away; interrupted steps are retried."
        : "Steps start when you act in the app. An interrupted step waits until you open the project and retry it.",
      problem: null,
    },
    {
      id: "google",
      name: "Sign in with Google",
      status: input.googleSignIn ? "on" : "off",
      label: input.googleSignIn ? "On" : "Off",
      what: "Lets you sign in with a Google account. It is used for sign-in only.",
      now: input.googleSignIn
        ? "Google confirms who you are. DeliverX does not read your Gmail, Drive or Calendar."
        : "Sign in with email instead.",
      problem: null,
    },
  ];
  return { rows, checkedAt: new Date(now).toISOString(), method: CONNECTIONS_METHOD };
}
