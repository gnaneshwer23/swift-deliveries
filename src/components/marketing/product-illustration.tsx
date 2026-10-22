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
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
