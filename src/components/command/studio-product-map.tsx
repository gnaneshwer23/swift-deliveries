/**
 * Interactive Product Intelligence Map for Studio entry dashboards.
 * Decorative sample artefacts are labelled Sample — not live evidence.
 */

const SPECIALISTS = [
  {
    id: "research",
    label: "Research",
    tone: "cyan" as const,
    pos: "tl" as const,
    seed: "Validate demand and competitive alternatives for ",
  },
  {
    id: "design",
    label: "Design",
    tone: "violet" as const,
    pos: "tr" as const,
    seed: "Shape a first-pass UX flow for ",
  },
  {
    id: "engineering",
    label: "Engineering",
    tone: "indigo" as const,
    pos: "bl" as const,
    seed: "Outline a buildable MVP architecture for ",
  },
  {
    id: "qa",
    label: "QA",
    tone: "amber" as const,
    pos: "br" as const,
    seed: "Define acceptance checks and risks for ",
  },
] as const;

export type StudioMapSpecialistId = (typeof SPECIALISTS)[number]["id"];

export function StudioProductMap({
  ideaPreview = "Your product idea",
  activeSpecialist = null,
  onSpecialistSelect,
  interactive = true,
}: {
  ideaPreview?: string;
  activeSpecialist?: StudioMapSpecialistId | null;
  onSpecialistSelect?: (id: StudioMapSpecialistId, seedPrefix: string) => void;
  interactive?: boolean;
}) {
  return (
    <div className="sd-map" role="img" aria-label="Product intelligence map preview">
      <div className="sd-float" data-kind="package">
        <small>
          Project package
          <em className="sd-sample">Sample</em>
        </small>
        <strong>Brief, evidence, next steps</strong>
        <p>Ships after you approve the investigation plan.</p>
      </div>

      {SPECIALISTS.map((chip) => {
        const active = activeSpecialist === chip.id;
        const body = (
          <>
            <i aria-hidden="true" />
            {chip.label}
          </>
        );
        return (
          <div
            key={chip.id}
            className={`sd-chip${active ? " is-active" : ""}`}
            data-tone={chip.tone === "cyan" ? undefined : chip.tone}
            data-pos={chip.pos}
          >
            {interactive && onSpecialistSelect ? (
              <button
                type="button"
                aria-pressed={active}
                aria-label={`Focus ${chip.label} specialist`}
                onClick={() => onSpecialistSelect(chip.id, chip.seed)}
              >
                {body}
              </button>
            ) : (
              body
            )}
          </div>
        );
      })}

      <div className="sd-core">
        <span>Idea</span>
        <strong>{ideaPreview.trim() || "Your product idea"}</strong>
      </div>

      <div className="sd-float" data-kind="brief">
        <small>
          AI PM briefing
          <em className="sd-sample">Sample</em>
        </small>
        <strong>Evidence-backed options</strong>
        <p>You approve before anything runs externally.</p>
      </div>
    </div>
  );
}

export { SPECIALISTS as STUDIO_MAP_SPECIALISTS };
