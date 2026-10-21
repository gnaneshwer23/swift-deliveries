import { capabilityRegistryData } from "./data";
import type {
  CapabilityRecord,
  CapabilityRegistry,
  DepartmentMeta,
  InfrastructureService,
  LifecycleStatus,
} from "./types";

const registry: CapabilityRegistry = capabilityRegistryData;

export const WAVE1_AVAILABLE_IDS: readonly string[] = registry.wave1_available_ids;

export function getCapabilityRegistry(): CapabilityRegistry {
  return registry;
}

export function listCapabilities(): CapabilityRecord[] {
  return registry.capabilities;
}

export function listDepartments(): DepartmentMeta[] {
  return registry.departments;
}

export function listInfrastructureServices(): InfrastructureService[] {
  return registry.infrastructure_services;
}

export function getCapability(id: string): CapabilityRecord | undefined {
  return registry.capabilities.find((c) => c.capability_id === id);
}

export function isOperational(status: LifecycleStatus): boolean {
  // Planned/Draft must never be treated as operational in UI or routing.
  return status === "available" || status === "testing";
}

/** Only Available may be routed to production missions (Wave 1 wired stubs). */
export function isAssignable(capability: CapabilityRecord): boolean {
  return capability.lifecycle_status === "available";
}

export function listAssignableCapabilities(): CapabilityRecord[] {
  return registry.capabilities.filter(isAssignable);
}

export function listCapabilitiesByStatus(status: LifecycleStatus | "all"): CapabilityRecord[] {
  if (status === "all") return registry.capabilities;
  return registry.capabilities.filter((c) => c.lifecycle_status === status);
}

export function getIntentCapabilityIds(
  intent: keyof CapabilityRegistry["intent_capability_map"],
): string[] {
  return registry.intent_capability_map[intent] ?? [];
}
