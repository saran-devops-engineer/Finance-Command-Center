/**
 * FCC V2 — Income model supporting Simple and Advanced modes.
 * Onboarding uses Simple Mode only; Advanced is optional in Profile.
 */

export const IncomeMode = {
  SIMPLE: "simple",
  ADVANCED: "advanced"
} as const;

export type IncomeModeValue = (typeof IncomeMode)[keyof typeof IncomeMode];

export const IncomeSourceKind = {
  SALARY: "salary",
  RENTAL: "rental",
  BUSINESS: "business",
  FREELANCING: "freelancing",
  INTEREST: "interest",
  DIVIDEND: "dividend",
  OTHER: "other"
} as const;

export type IncomeSourceKindValue = (typeof IncomeSourceKind)[keyof typeof IncomeSourceKind];

export interface IncomeSource {
  id: string;
  kind: IncomeSourceKindValue;
  label: string;
  monthlyAmount: number;
  /** Primary source used when migrating from V1 single income field. */
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeProfile {
  mode: IncomeModeValue;
  /** Simple mode — single monthly income value. */
  simpleMonthlyIncome: number;
  /** Advanced mode — multiple income sources. */
  sources: IncomeSource[];
  updatedAt: string;
}

/** Always derive total monthly income from the active mode. */
export function calculateTotalMonthlyIncome(profile: IncomeProfile): number {
  if (profile.mode === IncomeMode.SIMPLE) {
    return Math.max(profile.simpleMonthlyIncome, 0);
  }

  return profile.sources.reduce((sum, source) => sum + Math.max(source.monthlyAmount, 0), 0);
}

/** Build a simple-mode profile from a legacy V1 monthly income value. */
export function createSimpleIncomeProfile(monthlyIncome: number, now = new Date().toISOString()): IncomeProfile {
  return {
    mode: IncomeMode.SIMPLE,
    simpleMonthlyIncome: Math.max(monthlyIncome, 0),
    sources: [],
    updatedAt: now
  };
}
