export type LadderStage = "learn" | "work" | "build" | "prove" | "advance";

const STAGES: { key: LadderStage; n: string; name: string; desc: string }[] = [
  { key: "learn", n: "01", name: "Learn", desc: "Understand what the job actually asks of you." },
  { key: "work", n: "02", name: "Work", desc: "Do realistic product work with real constraints." },
  { key: "build", n: "03", name: "Build", desc: "Turn what you did into an explainable record." },
  { key: "prove", n: "04", name: "Prove", desc: "A coach confirms it. An outsider attests to it." },
  { key: "advance", n: "05", name: "Advance", desc: "Use it in interviews, applications and live work." },
];

export function JourneyLadder({ active }: { active?: LadderStage }) {
  return (
    <div className="ladder">
      <div className="ladder-rail">
        {STAGES.map((stage) => (
          <div
            key={stage.key}
            className={`ladder-step${active === stage.key ? " is-active" : ""}`}
          >
            <div className="ladder-n">{stage.n}</div>
            <div className="ladder-name">{stage.name}</div>
            <div className="ladder-desc">{stage.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
