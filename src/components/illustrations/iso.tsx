import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  C,
  S,
  iso,
  lift,
  r1,
  pathOf,
  hull,
  roundRect,
  circle,
  prism,
  frontRim,
  topMatrix,
  type P3,
} from "./iso-geometry";

// ---------------------------------------------------------------------------
// Shared gradients and filters (one set per SVG, keyed by an id prefix)
// ---------------------------------------------------------------------------
export function IsoDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-plateTop`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--ix-plate-top-a)" />
        <stop offset="1" stopColor="var(--ix-plate-top-b)" />
      </linearGradient>
      <linearGradient id={`${id}-plateSide`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--ix-plate-side-a)" />
        <stop offset="0.5" stopColor="var(--ix-plate-side-b)" />
        <stop offset="1" stopColor="var(--ix-plate-side-c)" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="var(--ix-glow)" stopOpacity="0.42" />
        <stop offset="0.14" stopColor="var(--ix-glow)" stopOpacity="0.1" />
        <stop offset="0.5" stopColor="var(--ix-glow)" stopOpacity="0.03" />
        <stop offset="0.86" stopColor="var(--ix-glow)" stopOpacity="0.1" />
        <stop offset="1" stopColor="var(--ix-glow)" stopOpacity="0.42" />
      </linearGradient>
      <linearGradient id={`${id}-glassFade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.75" />
        <stop offset="1" stopColor="#fff" stopOpacity="1" />
      </linearGradient>
      <mask id={`${id}-glassMask`} maskContentUnits="objectBoundingBox">
        <rect width="1" height="1" fill={`url(#${id}-glassFade)`} />
      </mask>
      <radialGradient id={`${id}-pool`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="var(--ix-glow)" stopOpacity="0.55" />
        <stop offset="0.55" stopColor="var(--ix-glow)" stopOpacity="0.16" />
        <stop offset="1" stopColor="var(--ix-glow)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-beam`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="var(--ix-glow)" stopOpacity="0.5" />
        <stop offset="1" stopColor="var(--ix-glow)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-agent`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ix-agent-a)" />
        <stop offset="1" stopColor="var(--ix-agent-b)" />
      </linearGradient>
      <linearGradient id={`${id}-agentLit`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="var(--ix-glow)" />
      </linearGradient>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------
type Common = { id: string; className?: string };

/** A rounded-square pedestal with a lit rim. */
export function Plate({
  id,
  at: [cx, cy, z],
  size,
  depth,
  height = 14,
  radius = 26,
  glow = false,
  className,
}: Common & {
  at: P3;
  size: number;
  depth?: number;
  height?: number;
  radius?: number;
  glow?: boolean;
}) {
  const ring = roundRect(cx, cy, size, depth ?? size, radius);
  const p = prism(ring, z - height, z);
  const inner = prism(
    roundRect(cx, cy, size - 12, (depth ?? size) - 12, Math.max(4, radius - 10)),
    z,
    z,
  );
  return (
    <g className={["ix-plate", className].filter(Boolean).join(" ")} data-glow={glow || undefined}>
      <path d={p.side} className="ix-plate-halo" filter={`url(#${id}-blur)`} />
      <path d={p.side} fill={`url(#${id}-plateSide)`} />
      <path d={frontRim(ring, z - height)} className="ix-rim-low" />
      <path d={p.top} fill={`url(#${id}-plateTop)`} className="ix-plate-top" />
      <path d={inner.top} className="ix-plate-inset" />
      <path d={frontRim(ring, z)} className="ix-rim" />
    </g>
  );
}

/** A glass vessel standing on z, with a glowing floor. Children sit inside. */
export function Glass({
  id,
  at: [cx, cy, z],
  r,
  h,
  children,
  className,
}: Common & { at: P3; r: number; h: number; children?: ReactNode }) {
  const ring = circle(cx, cy, r, 64);
  const side = prism(ring, z, z + h);
  const floor = lift(circle(cx, cy, r * 0.92, 48), z + 0.5);
  const [fx, fy] = iso([cx, cy, z]);
  return (
    <g className={["ix-glass", className].filter(Boolean).join(" ")}>
      <ellipse
        cx={fx}
        cy={fy}
        rx={r * C * 1.42}
        ry={r * S * 1.42}
        fill={`url(#${id}-pool)`}
        className="ix-pool"
      />
      <path d={pathOf(floor)} className="ix-glass-floor" />
      <path d={side.side} fill={`url(#${id}-glass)`} mask={`url(#${id}-glassMask)`} />
      {children}
      <path d={side.top} className="ix-glass-top" />
      <path d={pathOf(lift(circle(cx, cy, r * 0.86, 48), z + h))} className="ix-glass-top-inner" />
      <path d={frontRim(ring, z)} className="ix-glass-base" />
      <Streak at={[cx, cy, z]} r={r} h={h} side={-1} />
      <Streak at={[cx, cy, z]} r={r} h={h} side={1} />
    </g>
  );
}

function Streak({ at: [cx, cy, z], r, h, side }: { at: P3; r: number; h: number; side: 1 | -1 }) {
  const [x, y] = iso([cx, cy, z]);
  const sx = x + side * r * C * 1.32;
  return (
    <line
      x1={sx}
      y1={y - 6}
      x2={sx}
      y2={y - h * 0.82}
      className="ix-streak"
      strokeWidth={side < 0 ? 3 : 2}
    />
  );
}

/** A small agent figure: head and shoulders, facing the viewer. */
export function Agent({
  id,
  at,
  scale = 1,
  lit = false,
  className,
}: Common & { at: P3; scale?: number; lit?: boolean }) {
  const [x, y] = iso(at);
  const fill = `url(#${id}-${lit ? "agentLit" : "agent"})`;
  return (
    <g
      className={["ix-agent", className].filter(Boolean).join(" ")}
      transform={`translate(${r1(x)} ${r1(y)}) scale(${scale})`}
    >
      <ellipse cx="0" cy="0" rx="11" ry="5.2" className="ix-agent-shadow" />
      <path
        d="M-11 -1 C-11 -12 -6.5 -17 0 -17 C6.5 -17 11 -12 11 -1 Z"
        fill={fill}
        className="ix-agent-body"
      />
      <circle cx="0" cy="-24" r="7.2" fill={fill} className="ix-agent-head" />
      <path d="M-4.8 -27.5 C-2.5 -31.5 3.5 -31.5 5.6 -27" className="ix-agent-shine" />
    </g>
  );
}

/** An isometric cube. */
export function Cube({
  at: [x, y, z],
  s,
  tone = "mid",
  className,
}: {
  at: P3;
  s: number;
  tone?: "lit" | "mid" | "dim";
  className?: string;
}) {
  const h = s / 2;
  const top = [
    iso([x - h, y - h, z + s]),
    iso([x + h, y - h, z + s]),
    iso([x + h, y + h, z + s]),
    iso([x - h, y + h, z + s]),
  ];
  const left = [
    iso([x - h, y + h, z + s]),
    iso([x + h, y + h, z + s]),
    iso([x + h, y + h, z]),
    iso([x - h, y + h, z]),
  ];
  const right = [
    iso([x + h, y - h, z + s]),
    iso([x + h, y + h, z + s]),
    iso([x + h, y + h, z]),
    iso([x + h, y - h, z]),
  ];
  return (
    <g className={["ix-cube", className].filter(Boolean).join(" ")} data-tone={tone}>
      <path d={pathOf(left)} className="ix-cube-l" />
      <path d={pathOf(right)} className="ix-cube-r" />
      <path d={pathOf(top)} className="ix-cube-t" />
    </g>
  );
}

/** A flat card floating in the top plane (a document, record or note). */
export function Card({
  at,
  w,
  d,
  lines = 3,
  className,
}: {
  at: P3;
  w: number;
  d: number;
  lines?: number;
  className?: string;
}) {
  const [x, y, z] = at;
  const ring = roundRect(x, y, w / 2, d / 2, 2, 2);
  const p = prism(ring, z - 1.6, z);
  const ls = Array.from({ length: lines }, (_, i) => {
    const yy = y - d / 2 + 5 + (i * (d - 10)) / Math.max(1, lines - 1);
    const len = i === lines - 1 ? w * 0.4 : w * 0.7;
    return pathOf([iso([x - w / 2 + 4, yy, z]), iso([x - w / 2 + 4 + len, yy, z])], false);
  });
  return (
    <g className={["ix-card", className].filter(Boolean).join(" ")}>
      <path d={p.side} className="ix-card-side" />
      <path d={p.top} className="ix-card-top" />
      {ls.map((d, i) => (
        <path key={i} d={d} className="ix-card-line" />
      ))}
    </g>
  );
}

/** A lucide icon laid flat on the top plane. */
export function TopIcon({
  at,
  size = 20,
  icon: Icon,
  className,
}: {
  at: P3;
  size?: number;
  icon: LucideIcon;
  className?: string;
}) {
  const k = size / 24;
  return (
    <g
      transform={topMatrix(at, 1)}
      className={["ix-top-icon", className].filter(Boolean).join(" ")}
    >
      <g transform={`scale(${k}) translate(-12 -12)`}>
        <Icon width={24} height={24} strokeWidth={1.6} />
      </g>
    </g>
  );
}

/** An upright icon chip floating above a point, facing the viewer. */
export function FloatIcon({
  at,
  icon: Icon,
  size = 18,
  className,
}: {
  at: P3;
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  const [x, y] = iso(at);
  const box = size + 12;
  return (
    <g
      className={["ix-chip", className].filter(Boolean).join(" ")}
      transform={`translate(${r1(x)} ${r1(y - box / 2 - 4)})`}
    >
      <line x1="0" y1={box / 2} x2="0" y2={box / 2 + 6} className="ix-chip-stem" />
      <rect x={-box / 2} y={-box / 2} width={box} height={box} rx={8} className="ix-chip-bg" />
      <g transform={`translate(${-size / 2} ${-size / 2})`}>
        <Icon width={size} height={size} strokeWidth={1.7} />
      </g>
    </g>
  );
}

/** A glowing link between two world points, with an animated pulse. */
export function Flow({
  from,
  to,
  via = [],
  className,
}: {
  from: P3;
  to: P3;
  via?: P3[];
  className?: string;
}) {
  const pts = [from, ...via, to].map(iso);
  const d = pathOf(pts, false);
  return (
    <g className={["ix-flow", className].filter(Boolean).join(" ")}>
      <path d={d} className="ix-flow-base" />
      <path d={d} className="ix-flow-pulse" />
    </g>
  );
}

/** A vertical light beam rising from a point. */
export function Beam({ id, at, h, w = 14 }: { id: string; at: P3; h: number; w?: number }) {
  const [x, y] = iso(at);
  return (
    <rect
      x={x - w / 2}
      y={y - h}
      width={w}
      height={h}
      fill={`url(#${id}-beam)`}
      className="ix-beam"
    />
  );
}

/** Text in the illustration's label style. */
export function Label({
  x,
  y,
  children,
  anchor = "middle",
  tone = "strong",
  size = 13,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  tone?: "strong" | "muted" | "accent";
  size?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="ix-label" data-tone={tone} fontSize={size}>
      {children}
    </text>
  );
}
