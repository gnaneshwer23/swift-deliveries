import { iso, type P3 } from "./iso-geometry";

/** Department floors sit on a ring around the Product Brain. */
export const OFFICE_RING = 300;
/** Half-width and half-depth of a department floor. */
export const POD_W = 112;
export const POD_D = 80;
export const OFFICE_VIEWBOX = { x: -660, y: -350, w: 1320, h: 700 };

/** World centre of the k-th of `n` floors, starting at the back and going clockwise. */
export function podAt(k: number, n: number): P3 {
  const a = -Math.PI * 0.75 + (k / n) * Math.PI * 2;
  return [Math.cos(a) * OFFICE_RING, Math.sin(a) * OFFICE_RING, 0];
}

/** Desk offsets on a floor for one to four specialists, back row first. */
export function deskSpots(n: number): Array<[number, number]> {
  if (n <= 1) return [[0, 4]];
  if (n === 2)
    return [
      [-44, 4],
      [44, 4],
    ];
  if (n === 3)
    return [
      [-56, -18],
      [0, 24],
      [56, -18],
    ];
  return [
    [-58, -34],
    [58, -34],
    [-58, 36],
    [58, 36],
  ];
}

/**
 * Where a floor's HTML card is centred, as a fraction of the drawing. Cards sit
 * beside their floor, clear of the desks: outwards for side floors, back-left
 * for the floor at the back and front-right for the floor at the front.
 */
export function podAnchor(k: number, n: number) {
  const [x, y] = iso(podAt(k, n));
  const [dx, dy] = Math.abs(x) < 50 ? (y < 0 ? [-262, -62] : [262, 58]) : [Math.sign(x) * 226, -10];
  return {
    x: (x + dx - OFFICE_VIEWBOX.x) / OFFICE_VIEWBOX.w,
    y: (y + dy - OFFICE_VIEWBOX.y) / OFFICE_VIEWBOX.h,
  };
}
