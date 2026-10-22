/** Capability registry types (Workforce Architecture Spec v1.0 Part 6). */

import type { MissionIntent, PermissionLevel } from "../types";

export const LIFECYCLE_STATUSES = [
  "draft",
  "planned",
  "implementing",
  "testing",
  "available",
  "suspended",
  "retired",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const IMPLEMENTATION_TYPES = [
  "deterministic_service",
  "model_workflow",
  "tool_using_specialist",
  "coordinated_agent_workflow",
] as const;
export type ImplementationType = (typeof IMPLEMENTATION_TYPES)[number];

export type CapabilityLimits = {
  max_runtime_seconds: number;
  max_retries: number;
  max_concurrency: number;
  max_usage_credits: number;
};

export type CapabilityRecord = {
  capability_id: string;
  name: string;
  department: string;
  department_number: number;
  description: string;
  implementation_type: ImplementationType;
  lifecycle_status: LifecycleStatus;
  version: string;
  tool_allowlist: string[];
  permission_profile: PermissionLevel;
  limits: CapabilityLimits;
  owner: string;
  evaluation_notes: string;
  known_limitations: string[];
  activation_wave: number | null;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  dependencies: string[];
};

export type DepartmentMeta = {
  number: number;
  name: string;
  slug: string;
  capability_ids: string[];
};

/**
 * Deterministic infrastructure — NOT agents.
 * Governance: DX-148/DX-149 style monitoring may advise, but budget and
 * permission ceilings remain enforced by these services.
 */
export type InfrastructureService = {
  service_id: string;
  name: string;
  description: string;
  implementation_type: "deterministic_service";
  is_agent: false;
  enforces: string;
  owner: string;
  notes: string;
};

export type CapabilityRegistry = {
  version: string;
  spec: string;
  wave1_available_ids: string[];
  intent_capability_map: Record<MissionIntent, string[]>;
  departments: DepartmentMeta[];
  capabilities: CapabilityRecord[];
  infrastructure_services: InfrastructureService[];
};

export type AssignedCapability = {
  capability_id: string;
  name: string;
  department: string;
  lifecycle_status: LifecycleStatus;
  role_in_plan: string;
};

export type CapabilityMatchLimitation = {
  code: "department_unavailable" | "capability_not_available" | "no_match" | "out_of_scope";
  message: string;
  requested_department?: string;
  requested_capability_ids?: string[];
  alternative?: {
    summary: string;
    capability_ids: string[];
  };
};

export type CapabilityMatchResult = {
  assigned: AssignedCapability[];
  /** True when the request asked for unavailable specialist capacity. */
  limited: boolean;
  limitations: CapabilityMatchLimitation[];
};
