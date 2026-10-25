/**
 * A sample mission for the How it works walkthrough, with what the real
 * planner (`src/lib/workforce/planner.ts`) returns for it. Kept as a snapshot
 * so the public page does not ship the planner or the capability registry;
 * `sample-mission.test.ts` re-runs the planner and fails if they drift.
 */
import type { MissionIntent, PermissionLevel } from "@/lib/workforce/types";

export const SAMPLE_MISSION_INTENT: MissionIntent = "investigate";
export const SAMPLE_MISSION_REQUEST =
  "Investigate why new users leave during setup before they reach their first product.";

export const SAMPLE_MISSION_QUESTIONS = [
  {
    id: "audience",
    prompt: "Who is the primary audience for the investigation brief?",
    answer: "The founder and the product lead.",
  },
  {
    id: "success",
    prompt: "How will you know this mission succeeded?",
    answer: "We can name the top two reasons people leave, each backed by a supplied source.",
  },
] as const;

export const SAMPLE_MISSION_PLAN: {
  estimatedUsage: number;
  requiredPermission: PermissionLevel;
  capabilityIds: string[];
  tasks: Array<{
    key: string;
    title: string;
    acceptance: string;
    usage: number;
    permission: PermissionLevel;
    team: Array<{ id: string; name: string }>;
  }>;
} = {
  estimatedUsage: 26,
  requiredPermission: "execute_internally",
  capabilityIds: ["DX-001", "DX-002", "DX-011", "DX-012", "DX-018", "DX-020"],
  tasks: [
    {
      key: "scope",
      title: "Frame the investigation",
      acceptance: "Scope statement lists in-scope / out-of-scope and the decision owner.",
      usage: 4,
      permission: "plan",
      team: [
        { id: "DX-001", name: "Chief of Staff" },
        { id: "DX-002", name: "Problem-Framing" },
      ],
    },
    {
      key: "collect",
      title: "Collect inputs and separate evidence",
      acceptance: "Evidence table includes sourced facts and explicit assumptions.",
      usage: 8,
      permission: "execute_internally",
      team: [
        { id: "DX-011", name: "Research Planning" },
        { id: "DX-012", name: "Web Research" },
        { id: "DX-018", name: "Evidence Verification" },
      ],
    },
    {
      key: "brief",
      title: "Draft product investigation brief",
      acceptance: "Brief has summary, options, recommendation, and open questions.",
      usage: 10,
      permission: "create",
      team: [
        { id: "DX-020", name: "Research Synthesis" },
        { id: "DX-001", name: "Chief of Staff" },
      ],
    },
    {
      key: "agent_pass",
      title: "Agent review pass",
      acceptance: "Artefact marked Agent-reviewed; contradictions listed or cleared.",
      usage: 4,
      permission: "execute_internally",
      team: [
        { id: "DX-018", name: "Evidence Verification" },
        { id: "DX-020", name: "Research Synthesis" },
      ],
    },
  ],
};
