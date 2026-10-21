import type { ReactNode } from "react";

/**
 * Frames real product UI so a visitor can never mistake a sample record
 * for someone's actual results.
 */
export function ProductView({
  frameLabel,
  note,
  children,
}: {
  frameLabel: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="pv">
      <div className="pv-head">
        <span className="x-label">Product view</span>
        <span className="pv-frame">{frameLabel}</span>
      </div>
      <div className="pv-body">{children}</div>
      {note ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--x-border)" }}>
          <span className="caption">{note}</span>
        </div>
      ) : null}
    </div>
  );
}
