/**
 * What it would take to build the recommended first version — shown in Aria's briefing.
 *
 * Every number has a stated basis:
 * - AI build work: the usage the delivery plan's own tasks budget (`productMissionTasks`).
 * - First-version time: a rule-of-thumb range for the case's scope band, labelled as such.
 * - Technology: a starting suggestion from the brief's own words, each with its reason;
 *   the architecture stage confirms or replaces it.
 * Nothing here is a quote, and no money figure is invented.
 */
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { estimateStaffingBand } from "./pm-brief";
import type { Brief } from "./types";

export type TechChoice = { part: string; choice: string; why: string };

export type BuildEstimate = {
  band: "S" | "M" | "L" | "XL";
  firstVersion: { range: string; basis: string };
  aiWork: { stages: number; reviews: number; usageUnits: number; line: string };
  technology: TechChoice[];
  method: string;
};

const FIRST_VERSION: Record<BuildEstimate["band"], string> = {
  S: "1–2 weeks",
  M: "2–4 weeks",
  L: "4–8 weeks",
  XL: "8+ weeks",
};

const HINTS = {
  mobile: /\b(mobile|ios|android|phone|on the go|app store)\b/i,
  internal: /\b(dashboard|internal tool|admin|back[- ]office|b2b|for (my|our) team)\b/i,
  ai: /\b(ai|gpt|llm|chat ?bot|assistant|recommend\w*|predict\w*|summar\w*|generat\w*|classif\w*)\b/i,
  payments: /\b(pay|payments?|subscriptions?|checkout|billing|marketplace|bookings?)\b/i,
  realtime: /\b(chat|real[- ]time|live|messag\w*|notif\w*)\b/i,
  location: /\b(map|maps|location|nearby|delivery route|gps)\b/i,
};

export function suggestTechnology(text: string): TechChoice[] {
  const choices: TechChoice[] = [];
  if (HINTS.mobile.test(text)) {
    choices.push({
      part: "App",
      choice: "Mobile-first web app (installable)",
      why: "Runs on any phone without app-store review; native apps can follow once people use it.",
    });
  } else {
    choices.push({
      part: "App",
      choice: HINTS.internal.test(text) ? "Web app for desktop and tablet" : "Responsive web app",
      why: "The fastest way to put a first version in front of users on any device.",
    });
  }
  choices.push({
    part: "Data",
    choice: "Managed Postgres database",
    why: "Relational data with backups and access rules handled for you; fits most first versions.",
  });
  if (HINTS.ai.test(text)) {
    choices.push({
      part: "AI",
      choice: "Language-model API behind the server",
      why: "Keeps keys off the device; outputs are checked before anyone relies on them.",
    });
  }
  if (HINTS.payments.test(text)) {
    choices.push({
      part: "Payments",
      choice: "Hosted checkout from a payments provider",
      why: "You never handle card details yourself.",
    });
  }
  if (HINTS.realtime.test(text)) {
    choices.push({
      part: "Live updates",
      choice: "Managed realtime service",
      why: "Messages and status changes reach people without refreshing.",
    });
  }
  if (HINTS.location.test(text)) {
    choices.push({
      part: "Location",
      choice: "Maps and geolocation API",
      why: "Location features without building map data yourself.",
    });
  }
  return choices;
}

export function buildEstimate(brief: Brief): BuildEstimate {
  const text = [brief.question, brief.audience, brief.outcome, brief.constraints].join(" ");
  const band = estimateStaffingBand(brief.question).band as BuildEstimate["band"];
  const plan = productMissionTasks(brief.question, false);
  const stages = plan.filter((t) => !t.gate).length;
  const reviews = plan.filter((t) => t.gate).length;
  const usageUnits = plan.reduce((sum, t) => sum + (t.estimatedUsage ?? 0), 0);
  return {
    band,
    firstVersion: {
      range: FIRST_VERSION[band],
      basis: `Rule-of-thumb range for a ${band}-scope first version, built by the team and reviewed by you at each gate. Not a quote: the architecture stage replaces it with a plan-based estimate.`,
    },
    aiWork: {
      stages,
      reviews,
      usageUnits,
      line: `${stages} agent stages and ${reviews} reviews by you, budgeted at about ${usageUnits} usage units. Work stops at your usage ceiling.`,
    },
    technology: suggestTechnology(text),
    method:
      "Time is a rule-of-thumb range for the scope band; AI work is the delivery plan’s own task budget; technology is a starting suggestion from your brief’s words, which Keystone confirms or replaces in the architecture stage.",
  };
}
