import type { HomeLoanSimulationInput } from "@/services/home-loan-simulation/types";

export function resolveRemainingInstallments(input: HomeLoanSimulationInput) {
  return Math.max(input.remainingTenureMonths, 1);
}
