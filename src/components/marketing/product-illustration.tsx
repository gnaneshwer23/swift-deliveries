export const ILLUSTRATIONS = {
  "product-brain": {
    label: "A shared product record",
    alt: "Sources flow into a layered glass archive of product documents and decisions, with a brief emerging on the other side.",
  },
  "specialist-team": {
    label: "Different disciplines. One product.",
    alt: "Research, strategy, design, engineering and quality workstations connect to one shared product brief.",
  },
  "evidence-decision": {
    label: "Evidence in. Alternatives visible.",
    alt: "Three source documents feed three alternative paths, with one selected route leading to a decision dossier.",
  },
  "human-direction": {
    label: "Your decision moves the work forward",
    alt: "Queued task cards wait at a glass approval checkpoint before crossing to the delivery platform.",
  },
  "product-delivery": {
    label: "Work you can inspect and keep",
    alt: "A product workbench connects an architecture drawing, interface prototype, inspection station and organised file folio.",
  },
  "learning-loop": {
    label: "Build. Observe. Learn. Repeat.",
    alt: "An illuminated loop connects an idea sketch, product model, outcome chart and archive of lessons.",
  },
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

const HANDOFFS: Record<IllustrationName, string[]> = {
  "product-brain": [
    "Sources & brief",
    "Evidence register",
    "Decision record",
    "Versioned artefacts",
  ],
  "specialist-team": ["Research", "Product strategy", "Design & engineering", "QA review"],
  "evidence-decision": [
    "Research evidence",
    "Specialist positions",
    "Red-team challenge",
    "Verdict / your call",
  ],
  "human-direction": [
    "Team recommendation",
    "Your approval gate",
    "Approved work",
    "Reviewable output",
  ],
  "product-delivery": ["PRD & architecture", "Interface prototype", "QA checks", "Project export"],
  "learning-loop": ["Product decision", "Build & inspect", "Observed feedback", "Next hypothesis"],
};

/** Original generated artwork; meaningful captions and controls stay in HTML. */
export function ProductIllustration({
  name,
  caption,
  priority = false,
  compact = false,
}: {
  name: IllustrationName;
  caption?: string | undefined;
  priority?: boolean;
  compact?: boolean;
}) {
  return (
    <figure className={`psi-art${compact ? " psi-art-compact" : ""}`}>
      <p className="psi-art-title">{ILLUSTRATIONS[name].label}</p>
      <div className="psi-art-canvas">
        <img
          src={`/illustrations/${name}.webp`}
          srcSet={`/illustrations/${name}-small.webp 640w, /illustrations/${name}.webp 1200w`}
          sizes="(max-width: 720px) 94vw, (max-width: 1100px) 50vw, 600px"
          width="1200"
          height="800"
          alt={ILLUSTRATIONS[name].alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </div>
      <ol className="psi-art-handoffs" aria-label="Read the concept from left to right">
        {HANDOFFS[name].map((label, i) => (
          <li key={label}>
            <span>{i + 1}</span>
            {label}
            {i < 3 && <b aria-hidden="true">→</b>}
          </li>
        ))}
      </ol>
      <figcaption>
        {caption ??
          (name === "learning-loop"
            ? "Concept flow. Connected outcome learning is planned; observed feedback is supplied by you."
            : "Concept illustration. Labels describe the handoff direction; this is not a live application screenshot.")}
      </figcaption>
    </figure>
  );
}
