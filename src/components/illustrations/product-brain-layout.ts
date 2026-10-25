import {
  BookOpen,
  CheckCheck,
  Code2,
  FileStack,
  Hand,
  LineChart,
  Microscope,
  Package,
  PenTool,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { iso, type P3 } from "./iso-geometry";

/** Plate half-size, step between tiers in the plane and in height. */
export const A = 136;
/** Half-depth of each deck: decks are long and shallow so stations read clearly. */
export const AD = 72;
export const D = 150;
export const H = 140;
export const TH = 14;
export const POD = 27;
export const POD_H = 11;

export type BrainTier = "evidence" | "judgement" | "delivery";
export type BrainObject =
  | "sources"
  | "notes"
  | "research"
  | "results"
  | "strategy"
  | "review"
  | "human"
  | "design"
  | "engineering"
  | "qa"
  | "export";

export const tierAt = (k: number): P3 => [k * D, -k * D, k * H];
export const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const TIER_K: Record<BrainTier, number> = { evidence: 0, judgement: 1, delivery: 2 };

/** Work snakes through the tiers: evidence left to right, judgement right to left, delivery left to right. */
export const STATIONS: Array<{
  id: BrainObject;
  tier: BrainTier;
  x: number;
  icon: LucideIcon;
  label: string;
}> = [
  { id: "sources", tier: "evidence", x: -98, icon: FileStack, label: "Sources" },
  { id: "notes", tier: "evidence", x: -33, icon: BookOpen, label: "Notes" },
  { id: "research", tier: "evidence", x: 33, icon: Microscope, label: "Research" },
  { id: "results", tier: "evidence", x: 98, icon: LineChart, label: "Results" },
  { id: "strategy", tier: "judgement", x: 92, icon: Users, label: "Strategy" },
  { id: "review", tier: "judgement", x: 4, icon: ShieldCheck, label: "Review" },
  { id: "human", tier: "judgement", x: -88, icon: Hand, label: "You approve" },
  { id: "design", tier: "delivery", x: -98, icon: PenTool, label: "Design" },
  { id: "engineering", tier: "delivery", x: -33, icon: Code2, label: "Engineering" },
  { id: "qa", tier: "delivery", x: 33, icon: CheckCheck, label: "QA" },
  { id: "export", tier: "delivery", x: 98, icon: Package, label: "Artefacts" },
];
/** Stations sit on a line towards the back of each deck; labels and the lane run in front. */
export const ROW_Y = -14;

export const stationAt = (s: { tier: BrainTier; x: number }): P3 =>
  add(tierAt(TIER_K[s.tier]), [s.x, ROW_Y, 0]);

export const BRAIN_VIEWBOX = { x: -205, y: -432, w: 930, h: 572 };

export const BRAIN_ANCHORS: Record<BrainObject, { x: number; y: number }> = Object.fromEntries(
  STATIONS.map((s) => {
    const [sx, sy] = iso(add(stationAt(s), [0, 0, POD_H + 22]));
    return [
      s.id,
      {
        x: (sx - BRAIN_VIEWBOX.x) / BRAIN_VIEWBOX.w,
        y: (sy - BRAIN_VIEWBOX.y) / BRAIN_VIEWBOX.h,
      },
    ];
  }),
) as Record<BrainObject, { x: number; y: number }>;
