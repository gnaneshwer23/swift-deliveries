/**
 * Turns what the founder said or typed into a card of what was understood.
 * A card never acts: every action it offers needs an on-screen click, and
 * approvals are never offered at all. Voice and typing share this one path.
 * Deterministic, so the same words always give the same card.
 */
import {
  MISSION_INTENTS,
  STATUS_LABELS,
  TERMINAL_MISSION_STATUSES,
  type MissionIntent,
  type MissionStatus,
} from "@/lib/workforce/types";

/** How the founder's words reached us. Spoken words can be misheard; typed ones cannot. */
export type TurnInput = "typed" | "speech" | "edited";

export type ConversationContext = {
  projects: ReadonlyArray<{ id: string; name: string }>;
  missions: ReadonlyArray<{ id: string; title: string; status: MissionStatus; projectId: string }>;
  /** The mission the founder is looking at, if any. */
  currentMissionId?: string | null;
};

export type MissionRef = { id: string; title: string; status: MissionStatus };

/** Which mission a control request is about, and how sure we are. */
export type MissionTarget =
  | { match: "current" | "named" | "only"; mission: MissionRef }
  /** The mission meant is clear, but the request cannot apply to it in its current state. */
  | { match: "ineligible"; mission: MissionRef }
  | { match: "ambiguous" | "none"; candidates: MissionRef[] };

export type ProductTarget =
  | { match: "named"; projectId: string; name: string }
  /** The workspace's only product, assumed rather than named: shown for confirmation. */
  | { match: "only"; projectId: string; name: string }
  | { match: "ambiguous"; candidates: Array<{ id: string; name: string }> }
  /** No products yet: a first one is created with the mission. */
  | { match: "new" };

export type UnderstoodCard =
  | {
      kind: "draft_mission";
      intent: MissionIntent;
      requestText: string;
      product: ProductTarget;
      /**
       * Things that must be confirmed in writing before the mission can be drafted:
       * numbers heard in speech, and a product that was assumed or is ambiguous.
       */
      confirm: string[];
    }
  | { kind: "status"; target: MissionTarget }
  | { kind: "pause" | "cancel" | "resume"; target: MissionTarget }
  /** Approvals are given on screen only; the card links to where to give it. */
  | { kind: "approval_refused"; target: MissionTarget }
  /** "Stop talking": silences the assistant and never touches a mission. */
  | { kind: "stop_speech" }
  | { kind: "unclear"; question: string };

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP_SPEECH =
  /^(?:please )?(?:stop|stop talking|stop speaking|be quiet|quiet|shush|hush|silence|enough|that's enough)(?: please)?$/;
const FILLER = "(?:the |this |that |my |our )?(?:[\\p{L}\\p{N}']+ ){0,4}?";

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A control request: the verb on its own ("cancel it"), the verb aimed at a
 * mission ("pause the tutor mission"), or the verb aimed at a mission's title
 * ("pause Tutor discovery"). A brief that merely contains the word ("an app to
 * cancel subscriptions", "why students pause lessons") is not one.
 */
function control(text: string, verbs: string, targets: string, titles: readonly string[]): boolean {
  // A pronoun counts only when it ends the request ("pause it"), never mid-sentence.
  const alone = new RegExp(
    `^(?:please |can you |could you |i want to |let's |ok |okay )*(?:${verbs})(?: (?:it|that|this|everything))?(?: (?:now|please))*$`,
    "u",
  );
  const aimed = new RegExp(`\\b(?:${verbs}) ${FILLER}(?:${targets})\\b`, "u");
  if (alone.test(text) || aimed.test(text)) return true;
  return titles.some((t) => {
    const title = norm(t);
    return (
      title.length > 0 &&
      new RegExp(`\\b(?:${verbs}) (?:the |my |our )?${escape(title)}(?: |$)`, "u").test(text)
    );
  });
}

const APPROVE_VERBS = "approve|sign off on|sign off|green ?light";
const APPROVE_TARGETS = "plan|gate|scope|stage|step|prd|mission";
const GO_AHEAD =
  /\bgo ahead and (?:run|build|start|execute)\b|\b(?:accept|pass) the (?:plan|gate|scope)\b/;
const MISSION_TARGETS = "mission|missions|run|work";
const STATUS =
  /\b(?:status|progress|update me|what's happening|what is happening|how(?:'s| is| are) (?:it|the mission|things|my mission)|where are we|what's done|what is done)\b/;
const NEGATED_ACTION = /\b(?:don't|do not|never|not)\b/;

const INTENT_WORDS: Array<[MissionIntent, RegExp]> = [
  ["prototype", /\b(?:prototype|mock ?up|mockup|clickable|wireframe|demo)\b/],
  ["build", /\b(?:build|ship|launch|implement|develop|make the product)\b/],
  ["improve", /\b(?:improve|fix|better|redesign|optimi[sz]e|speed up|reduce churn)\b/],
  ["investigate", /\b(?:investigate|research|explore|find out|understand|validate|discover)\b/],
];

const NUMBER_WORDS =
  "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|half|dozen";
const NUMBER_TOKEN = new RegExp(
  `^(?:[£$€]?\\d[\\d,.]*(?:%|k|m|bn)?|(?:${NUMBER_WORDS})(?:-(?:${NUMBER_WORDS}))*|percent)$`,
  "i",
);

/** Numbers in the founder's words, each with two words either side, as they were heard. */
export function heardNumbers(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const bare = (w: string) => w.replace(/^[^\p{L}\p{N}£$€]+|[^\p{L}\p{N}%]+$/gu, "");
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (!NUMBER_TOKEN.test(bare(words[i]!))) continue;
    let j = i;
    while (j + 1 < words.length && NUMBER_TOKEN.test(bare(words[j + 1]!))) j++;
    out.push(words.slice(Math.max(0, i - 2), j + 3).join(" "));
    i = j;
  }
  return [...new Set(out)];
}

function wordsIn(haystack: string, needle: string): boolean {
  const n = norm(needle);
  return n.length > 0 && ` ${haystack} `.includes(` ${n} `);
}

function ref(m: ConversationContext["missions"][number]): MissionRef {
  return { id: m.id, title: m.title, status: m.status };
}

/**
 * Which mission a request is about. Never guesses between several, and says so
 * when the mission meant is in a state the request cannot apply to.
 */
export function resolveMission(
  said: string,
  ctx: ConversationContext,
  eligible: (s: MissionStatus) => boolean = () => true,
): MissionTarget {
  const text = norm(said);
  const current = ctx.currentMissionId
    ? ctx.missions.find((m) => m.id === ctx.currentMissionId)
    : undefined;
  const pick = (m: ConversationContext["missions"][number], match: "named" | "current") =>
    eligible(m.status)
      ? { match, mission: ref(m) }
      : { match: "ineligible" as const, mission: ref(m) };
  const named = ctx.missions.filter((m) => wordsIn(text, m.title));
  if (named.length === 1) return pick(named[0]!, "named");
  if (named.length > 1) {
    const usable = named.filter((m) => eligible(m.status));
    if (usable.length === 1) return { match: "named", mission: ref(usable[0]!) };
    return { match: usable.length ? "ambiguous" : "none", candidates: usable.map(ref) };
  }
  if (current) return pick(current, "current");
  const open = ctx.missions.filter((m) => eligible(m.status));
  if (open.length === 1) return { match: "only", mission: ref(open[0]!) };
  return { match: open.length ? "ambiguous" : "none", candidates: open.map(ref) };
}

function resolveProduct(said: string, ctx: ConversationContext): ProductTarget {
  const text = norm(said);
  if (ctx.projects.length === 0) return { match: "new" };
  const named = ctx.projects.filter((p) => wordsIn(text, p.name));
  if (named.length === 1) return { match: "named", projectId: named[0]!.id, name: named[0]!.name };
  if (named.length > 1)
    return { match: "ambiguous", candidates: named.map((p) => ({ id: p.id, name: p.name })) };
  if (ctx.projects.length === 1)
    return { match: "only", projectId: ctx.projects[0]!.id, name: ctx.projects[0]!.name };
  return {
    match: "ambiguous",
    candidates: ctx.projects.map((p) => ({ id: p.id, name: p.name })),
  };
}

function intentOf(text: string): MissionIntent {
  for (const [intent, re] of INTENT_WORDS) if (re.test(text)) return intent;
  return "investigate";
}

const isOpen = (s: MissionStatus) => !TERMINAL_MISSION_STATUSES.includes(s);

/** The states each request can apply to; the server enforces the same rules. */
const ELIGIBLE: Record<
  "approval_refused" | "pause" | "cancel" | "resume",
  (s: MissionStatus) => boolean
> = {
  approval_refused: isOpen,
  cancel: isOpen,
  pause: (s) => ["queued", "running", "blocked"].includes(s),
  resume: (s) => s === "paused",
};

/** What the founder's words were understood to mean. Nothing here acts. */
export function interpret(
  said: string,
  input: TurnInput,
  ctx: ConversationContext,
): UnderstoodCard {
  const raw = said.trim();
  const text = norm(raw);
  if (!text)
    return { kind: "unclear", question: "I didn't catch anything. Say or type your request." };
  if (STOP_SPEECH.test(text)) return { kind: "stop_speech" };

  const titles = ctx.missions.map((m) => m.title);
  const asks = (verbs: string, targets = MISSION_TARGETS) => control(text, verbs, targets, titles);
  const kind: Extract<UnderstoodCard, { target: MissionTarget }>["kind"] | null =
    GO_AHEAD.test(text) || asks(APPROVE_VERBS, APPROVE_TARGETS)
      ? "approval_refused"
      : asks("cancel|abort|kill|scrap|stop")
        ? "cancel"
        : asks("pause|hold") || /\bput (?:it|the mission|this mission) on hold\b/.test(text)
          ? "pause"
          : asks("resume|unpause|restart|continue|carry on")
            ? "resume"
            : null;
  // "Don't cancel it" asks for nothing: it is neither a control nor a brief.
  if (kind && NEGATED_ACTION.test(text))
    return { kind: "unclear", question: "Understood: I won't. Nothing has changed." };
  // Approvals come first: a request that mixes approval with anything else is still refused.
  if (kind) return { kind, target: resolveMission(raw, ctx, ELIGIBLE[kind]) };
  // A long sentence that mentions progress is a brief, not a question about a mission.
  if (STATUS.test(text) && text.split(" ").length <= 10)
    return { kind: "status", target: resolveMission(raw, ctx) };

  if (text.split(" ").length < 4)
    return {
      kind: "unclear",
      question:
        "Tell me a little more: what product is it, who is it for, and what should the mission find out or make?",
    };

  const product = resolveProduct(raw, ctx);
  const confirm: string[] = [];
  // Typed words are already in writing; spoken ones are confirmed before anything is drafted.
  if (input === "speech") for (const n of heardNumbers(raw)) confirm.push(`Number heard: “${n}”`);
  if (product.match === "only") confirm.push(`Product: ${product.name}`);
  return {
    kind: "draft_mission",
    intent: intentOf(text),
    requestText: raw.slice(0, 4000),
    product,
    confirm,
  };
}

const targetName = (t: MissionTarget) =>
  "mission" in t ? `“${t.mission.title}” (${STATUS_LABELS[t.mission.status].toLowerCase()})` : null;

const DONE_TO = { pause: "paused", cancel: "cancelled", resume: "resumed" } as const;

/** The assistant's reply for a card: says what was understood and what needs a click. */
export function replyFor(card: UnderstoodCard): string {
  switch (card.kind) {
    case "draft_mission": {
      const product =
        card.product.match === "new"
          ? "a new product"
          : card.product.match === "ambiguous"
            ? "a product you'll pick"
            : card.product.name;
      const checks = card.confirm.length
        ? ` Please confirm ${card.confirm.length === 1 ? "one detail" : `${card.confirm.length} details`} in writing first.`
        : "";
      return `Here's what I understood: a ${card.intent} mission for ${product}. Check the brief, correct anything, then click Draft mission plan. Nothing runs until you approve the plan.${checks}`;
    }
    case "status":
      return targetName(card.target)
        ? `Here's what the event log records for ${targetName(card.target)}.`
        : "Which mission? Pick one below.";
    case "pause":
    case "cancel":
    case "resume": {
      const verb = card.kind;
      if (card.target.match === "ineligible")
        return `${targetName(card.target)} can't be ${DONE_TO[verb]} in its current state, so there's nothing to click.`;
      if (card.target.match === "none")
        return `There's no mission that can be ${DONE_TO[verb]} right now.`;
      return targetName(card.target)
        ? `To ${verb} ${targetName(card.target)}, click ${verb[0]!.toUpperCase()}${verb.slice(1)} below. I won't ${verb} it on a spoken request alone.`
        : `Which mission should I ${verb}? Pick one below, then click to confirm.`;
    }
    case "approval_refused":
      if (card.target.match === "ineligible")
        return `${targetName(card.target)} has finished, so there is nothing left to approve. In any case, I can't approve anything: approvals need an on-screen click.`;
      return "I can't approve anything. Approvals need an on-screen click on the plan or the gate. I can open it for you.";
    case "stop_speech":
      return "Stopped talking. Your missions are unchanged.";
    case "unclear":
      return card.question;
  }
}

export const INTENTS = MISSION_INTENTS;
