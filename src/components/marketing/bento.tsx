import type { ReactNode } from "react";

export function Bento({ children }: { children: ReactNode }) {
  return <div className="bento">{children}</div>;
}

export function BentoTile({
  label,
  title,
  body,
  foot,
  span,
  onInk,
  children,
}: {
  label?: string;
  title?: string;
  body?: string;
  foot?: string;
  span?: 2 | 3 | 4 | 6;
  onInk?: boolean;
  children?: ReactNode;
}) {
  const classes = [
    "bento-tile",
    span && span !== 2 ? `span-${span}` : "",
    onInk ? "on-ink" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {label ? <div className="x-label">{label}</div> : null}
      {title ? <div className="bento-title">{title}</div> : null}
      {body ? <p className="bento-body">{body}</p> : null}
      {children}
      {foot ? <div className="bento-foot">{foot}</div> : null}
    </div>
  );
}
