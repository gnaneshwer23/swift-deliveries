/**
 * How every project runs, as one strip: the outlined steps wait for you.
 * Shared by the homepage and the other landing pages so they tell the same story.
 */
export const RUN_STEPS = [
  { label: "Idea", who: "You describe it", you: true },
  { label: "Plan", who: "You approve it", you: true },
  { label: "Research", who: "Specialists", you: false },
  { label: "Decide", who: "You choose", you: true },
  { label: "Build", who: "Specialists", you: false },
  { label: "Record", who: "You download it", you: false },
] as const;

export function RunStrip({ className = "" }: { className?: string }) {
  return (
    <ol className={`hp-runs ${className}`.trim()} aria-label="How a project runs">
      {RUN_STEPS.map((step, i) => (
        <li key={step.label} data-you={step.you ? "true" : undefined}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <strong>{step.label}</strong>
          <em>{step.who}</em>
        </li>
      ))}
    </ol>
  );
}
