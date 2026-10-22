/**
 * Customer interview programme.
 *
 * Agents can write the guide, recruit profiles and rehearse with synthetic
 * personas — useful for sharpening questions and hypotheses. Synthetic
 * sessions are NEVER evidence: hypotheses only move to "has real evidence"
 * when the operator adds notes from real conversations.
 */
import { displayName } from "./roster";
import { hashSeed, pick, rng } from "./rng";
import type { BusinessCase, InterviewPersona, InterviewRecord, TranscriptTurn } from "./types";

const FIRST_NAMES = [
  "Asha",
  "Ben",
  "Chloe",
  "Dev",
  "Ewa",
  "Femi",
  "Grace",
  "Hiro",
  "Ines",
  "Jon",
  "Kemi",
  "Liam",
];
const ATTITUDES = ["enthusiast", "pragmatist", "sceptic"] as const;
type Attitude = (typeof ATTITUDES)[number];

export function hypothesesFor(bc: BusinessCase): InterviewRecord["hypotheses"] {
  const users = bc.targetUsers || "target users";
  const problem = bc.problem || bc.idea;
  return [
    {
      id: "H1",
      statement: `${users} experience "${problem.slice(0, 90)}" often enough to look for a solution.`,
      status: "untested",
    },
    {
      id: "H2",
      statement: `Current workarounds cost ${users} meaningful time or money.`,
      status: "untested",
    },
    {
      id: "H3",
      statement: `${users} would adopt ${bc.name} if it delivers the first outcome within one session.`,
      status: "untested",
    },
    {
      id: "H4",
      statement: `${users} would pay for ${bc.name} at a price consistent with the business case.`,
      status: "untested",
    },
  ];
}

export const INTERVIEW_GUIDE = [
  "Tell me about the last time you dealt with this problem. What happened?",
  "What did you try? What did it cost you in time or money?",
  "What would have to be true for you to switch to something new?",
  "Walk me through how you decide to pay for tools like this.",
  "What would make you stop using a new product in the first week?",
];

const ANSWERS: Record<Attitude, string[]> = {
  enthusiast: [
    "It happens every week and it's frustrating — I'd try anything that helps.",
    "I've cobbled together spreadsheets; it takes hours.",
    "If it worked on day one, I'd switch immediately.",
    "I'd pay if it clearly saves me time.",
    "If setup took too long, I'd drop it.",
  ],
  pragmatist: [
    "It comes up, but I've learnt to live with it.",
    "My workaround is clunky but free.",
    "I'd need to see it fit my existing tools.",
    "Only if the price is predictable and low.",
    "Anything that adds steps would put me off.",
  ],
  sceptic: [
    "Honestly it's not a top-three problem for me.",
    "My current approach is good enough.",
    "I've been burnt by new tools before — I'd wait.",
    "I wouldn't pay until colleagues vouch for it.",
    "Any data-privacy doubt and I'm out.",
  ],
};

export function runInterviewProgramme(
  bc: BusinessCase,
  seed: string,
  owner: string,
  team: string[],
): InterviewRecord {
  const rand = rng(hashSeed(seed, "interviews"));
  const segments = (bc.targetUsers || "Primary users")
    .split(/,|;|\band\b|\//i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 3);
  const personas: InterviewPersona[] = [];
  segments.forEach((segment, si) => {
    for (let k = 0; k < 2; k++) {
      const attitude = ATTITUDES[(si + k) % ATTITUDES.length]!;
      personas.push({
        id: `P${personas.length + 1}`,
        name: `${pick(rand, FIRST_NAMES)} (synthetic ${attitude})`,
        segment,
        context: `Synthetic ${attitude} persona from the "${segment}" segment, generated for interview rehearsal.`,
        synthetic: true,
      });
    }
  });

  const interviewers = [owner, ...team].filter((x) => x);
  const sessions = personas.map((p, i) => {
    const attitude = (ATTITUDES.find((a) => p.name.includes(a)) ?? "pragmatist") as Attitude;
    const interviewer = interviewers[i % interviewers.length]!;
    const turns: TranscriptTurn[] = [];
    INTERVIEW_GUIDE.forEach((q, qi) => {
      turns.push({ speaker: interviewer, kind: "question", text: q });
      turns.push({ speaker: p.id, kind: "update", text: ANSWERS[attitude][qi]! });
    });
    return { personaId: p.id, interviewer, turns, synthetic: true };
  });

  const counts = Object.fromEntries(
    ATTITUDES.map((a) => [a, personas.filter((p) => p.name.includes(a)).length]),
  ) as Record<Attitude, number>;
  const hypotheses = hypothesesFor(bc).map((h) => ({ ...h, status: "synthetic_signal" as const }));

  const synthesis = `Rehearsal across ${personas.length} synthetic personas (${counts.enthusiast} enthusiast, ${counts.pragmatist} pragmatist, ${counts.sceptic} sceptic).
Signals worth testing with real people: switching cost and setup time dominate; price sensitivity is high outside enthusiasts; privacy doubts are a deal-breaker for sceptics.
**These are hypotheses for real interviews, not findings.** No hypothesis is validated until real interview notes are added.
Recruit 5–8 real ${bc.targetUsers || "users"} per segment; ${displayName(owner)} owns synthesis.`;

  return { guide: INTERVIEW_GUIDE, hypotheses, personas, sessions, synthesis };
}

export function interviewMarkdown(
  rec: InterviewRecord,
  realNotes: Array<{ title: string; body: string }>,
): string {
  return `# Customer interview programme

> Synthetic sessions are rehearsal material only. Hypotheses are validated solely by real interview notes (${realNotes.length} added).

## Hypotheses
| ID | Hypothesis | Status |
| --- | --- | --- |
${rec.hypotheses.map((h) => `| ${h.id} | ${h.statement.replaceAll("|", "/")} | ${realNotes.length ? "has real evidence — needs your judgement" : h.status === "synthetic_signal" ? "synthetic signal only" : "untested"} |`).join("\n")}

## Interview guide
${rec.guide.map((g, i) => `${i + 1}. ${g}`).join("\n")}

## Synthetic rehearsal personas
${rec.personas.map((p) => `- **${p.id} ${p.name}** — ${p.segment}. ${p.context}`).join("\n")}

## Rehearsal sessions
${rec.sessions
  .map(
    (s) =>
      `### ${s.personaId} (synthetic) — interviewer ${displayName(s.interviewer)}\n${s.turns
        .map((t) => `- **${t.kind === "question" ? "Q" : "A"}:** ${t.text}`)
        .join("\n")}`,
  )
  .join("\n\n")}

## Synthesis
${rec.synthesis}

## Real interview notes
${realNotes.length ? realNotes.map((n) => `### ${n.title}\n${n.body}`).join("\n\n") : "None yet. Add notes from real conversations in the dashboard."}
`;
}
