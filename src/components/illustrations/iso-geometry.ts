/**
 * Isometric illustration primitives for the DeliverX platform story.
 *
 * Everything is plain SVG built from one projection, so compositions stay
 * crisp at any size, theme through CSS variables and animate with CSS only.
 * World units: x to the lower right, y to the lower left, z up.
 */

export const C = Math.cos(Math.PI / 6);
export const S = 0.5;

export type Pt = [number, number];
export type P3 = [number, number, number];

export const iso = ([x, y, z]: P3): Pt => [(x - y) * C, (x + y) * S - z];

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const pathOf = (pts: Pt[], closed = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("") + (closed ? "Z" : "");

/** Convex hull (monotone chain) of screen points. */
export function hull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** A rounded square (or rectangle) on the floor, as plane points. */
export function roundRect(cx: number, cy: number, hw: number, hd: number, r: number, steps = 6) {
  const out: Array<[number, number]> = [];
  const corners: Array<[number, number, number]> = [
    [cx + hw - r, cy + hd - r, 0],
    [cx - hw + r, cy + hd - r, Math.PI / 2],
    [cx - hw + r, cy - hd + r, Math.PI],
    [cx + hw - r, cy - hd + r, (3 * Math.PI) / 2],
  ];
  for (const [x, y, a0] of corners)
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      out.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
  return out;
}

export function circle(cx: number, cy: number, r: number, steps = 48) {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  });
}

export const lift = (ring: Array<[number, number]>, z: number) =>
  ring.map(([x, y]) => iso([x, y, z]));

/** Paths for a prism: top face and the visible side band. */
export function prism(ring: Array<[number, number]>, z0: number, z1: number) {
  const top = lift(ring, z1);
  const bottom = lift(ring, z0);
  return { top: pathOf(top), side: pathOf(hull([...top, ...bottom])), bottom: pathOf(bottom) };
}

/** The near (lower) half of a ring at height z: the visible front rim. */
export function frontRim(ring: Array<[number, number]>, z: number) {
  const pts = lift(ring, z);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const front = pts.map((p, i) => ({ p, i, f: p[1] >= cy - 0.01 }));
  // rotate so the run of front points is contiguous
  const start = front.findIndex((q, i) => q.f && !front[(i - 1 + front.length) % front.length]!.f);
  if (start < 0) return pathOf(pts, true);
  const run: Pt[] = [];
  for (let k = 0; k < front.length; k++) {
    const q = front[(start + k) % front.length]!;
    if (!q.f) break;
    run.push(q.p);
  }
  void cx;
  return pathOf(run, false);
}

/** A matrix that lays flat 2D artwork onto the top plane at a point. */
export const topMatrix = ([x, y, z]: P3, scale = 1) => {
  const [tx, ty] = iso([x, y, z]);
  return `matrix(${r1(C * scale * 100) / 100} ${r1(S * scale * 100) / 100} ${r1(-C * scale * 100) / 100} ${r1(S * scale * 100) / 100} ${r1(tx)} ${r1(ty)})`;
};
