export type PlanLimits = {
  maxStores: number
  maxMembers: number
}

export const defaultPlanLimits: PlanLimits = {
  maxStores: 3,
  maxMembers: 10,
}

export function getOrganizationPlanLimits(): PlanLimits {
  // In a real scenario, fetch limits from organization plan/tier.
  // For now, return defaults.
  return defaultPlanLimits
}
