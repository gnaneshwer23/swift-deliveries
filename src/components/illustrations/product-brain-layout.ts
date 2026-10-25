import { iso, type P3 } from "./iso-geometry";
import {
  BookOpen,
  Boxes,
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

/** Plate half-size, step between tiers in the plane and in height. */
export const A = 124;
export const D = 150;
export const H = 150;
export const TH = 14;

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

export const TIERS: Array<{ id: BrainTier; k: number; title: string; caption: string }> = [
  {
    id: "evidence",
    k: 0,
    title: "01 Evidence & memory",
    caption: "Sources · notes · research · results",
  },
  { id: "judgement", k: 1, title: "02 Judgement", caption: "Compare · challenge · you decide" },
  { id: "delivery", k: 2, title: "03 Delivery", caption: "Design · engineering · QA · release" },
];

export const SATELLITES: Array<{
  id: BrainObject;
  tier: BrainTier;
  at: [number, number];
  icon: LucideIcon;
}> = [
  { id: "sources", tier: "evidence", at: [-82, 84], icon: FileStack },
  { id: "notes", tier: "evidence", at: [-28, 84], icon: BookOpen },
  { id: "research", tier: "evidence", at: [26, 84], icon: Microscope },
  { id: "results", tier: "evidence", at: [84, 70], icon: LineChart },
  { id: "strategy", tier: "judgement", at: [-70, 84], icon: Users },
  { id: "review", tier: "judgement", at: [-6, 84], icon: ShieldCheck },
  { id: "human", tier: "judgement", at: [70, 78], icon: Hand },
  { id: "design", tier: "delivery", at: [-82, 84], icon: PenTool },
  { id: "engineering", tier: "delivery", at: [-28, 84], icon: Code2 },
  { id: "qa", tier: "delivery", at: [26, 84], icon: CheckCheck },
  { id: "export", tier: "delivery", at: [84, 70], icon: Package },
];

export const TIER_K: Record<BrainTier, number> = { evidence: 0, judgement: 1, delivery: 2 };
export const POD = 19;
export const POD_H = 9;

// View box: fitted around the three tiers and their labels.
export const BRAIN_VIEWBOX = { x: -250, y: -540, w: 1010, h: 700 };

export const BRAIN_ANCHORS: Record<BrainObject, { x: number; y: number }> = Object.fromEntries(
  SATELLITES.map((s) => {
    const [x, y, z] = add(tierAt(TIER_K[s.tier]), [s.at[0], s.at[1], POD_H + 2]);
    const [sx, sy] = iso([x, y, z]);
    return [
      s.id,
      {
        x: (sx - BRAIN_VIEWBOX.x) / BRAIN_VIEWBOX.w,
        y: (sy - BRAIN_VIEWBOX.y) / BRAIN_VIEWBOX.h,
      },
    ];
  }),
) as Record<BrainObject, { x: number; y: number }>;
