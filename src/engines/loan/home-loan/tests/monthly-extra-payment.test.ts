import { describe, expect, it } from "vitest";
import { monthlyExtraPaymentSimulator } from "@/engines/loan/home-loan/simulators/monthly-extra-payment";
import {
  validateMonthlyExtraSimulation,
  validateMonthlyExtraRequest
} from "@/engines/loan/home-loan/validators/monthly-extra-validation";
import type { HomeLoanSnapshot } from "@/engines/loan/home-loan/types/LoanInterfaces";

const baseLoan: HomeLoanSnapshot = {
  loanId: "home-1",
  originalPrincipal: 4_200_000,
  outstandingPrincipal: 3_820_000,
  annualInterestRate: 8.6,
  monthlyEmi: 45_200,
  remainingTenureMonths: 214,
  asOfDate: "2026-07-07",
  status: "active",
  rateType: "fixed"
};

function simulate(
  monthlyExtraAmount: number,
  method: "reduce-tenure" | "reduce-emi" = "reduce-tenure",
  overrides: Partial<HomeLoanSnapshot> = {},
  options: {
    endMonthIndex?: number;
    startMonth?: string;
    endMonth?: string;
    monthlyAvailableMoney?: number;
  } = {}
) {
  return monthlyExtraPaymentSimulator.simulate({
    loan: { ...baseLoan, ...overrides },
    monthlyExtraAmount,
    startMonthIndex: options.startMonth ? undefined : 0,
    startMonth: options.startMonth,
    endMonthIndex: options.endMonth ? undefined : options.endMonthIndex,
    endMonth: options.endMonth,
    method,
    recommendationContext: {
      emergencyBuffer: 240_000,
      minimumEmergencyBuffer: 100_000,
      monthlyCashFlow: 26_350,
      monthlyAvailableMoney: options.monthlyAvailableMoney ?? 15_000,
      canMaintainConsistently: true
    }
  });
}

describe("Rule Set 02 — monthly extra validation", () => {
  it("rejects zero extra payment", () => {
    const result = validateMonthlyExtraSimulation({
      loan: baseLoan,
      monthlyExtraAmount: 0,
      startMonthIndex: 0
    });
    expect(result.valid).toBe(false);
  });

  it("rejects negative extra payment", () => {
    const result = validateMonthlyExtraSimulation({
      loan: baseLoan,
      monthlyExtraAmount: -1,
      startMonthIndex: 0
    });
    expect(result.valid).toBe(false);
  });

  it("rejects payment greater than monthly available money", () => {
    const result = validateMonthlyExtraRequest({
      loan: baseLoan,
      monthlyExtraAmount: 20_000,
      startMonthIndex: 0,
      recommendationContext: { monthlyAvailableMoney: 10_000 }
    });
    expect(result.valid).toBe(false);
  });

  it("rejects archived loans", () => {
    const result = validateMonthlyExtraSimulation({
      loan: { ...baseLoan, status: "archived" },
      monthlyExtraAmount: 5_000,
      startMonthIndex: 0
    });
    expect(result.valid).toBe(false);
  });

  it("warns when extra payment exceeds current EMI", () => {
    const result = validateMonthlyExtraSimulation({
      loan: baseLoan,
      monthlyExtraAmount: 50_000,
      startMonthIndex: 0
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "monthly-extra.exceeds-emi")).toBe(true);
  });

  it("warns when extra payment exceeds outstanding principal", () => {
    const result = validateMonthlyExtraSimulation({
      loan: { ...baseLoan, outstandingPrincipal: 25_000 },
      monthlyExtraAmount: 30_000,
      startMonthIndex: 0
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "monthly-extra.exceeds-outstanding")).toBe(true);
  });
});

describe("Rule Set 02 — monthly extra simulation", () => {
  it("simulates ₹1,000 extra/month", () => {
    const result = simulate(1_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("simulates ₹5,000 extra/month", () => {
    const result = simulate(5_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.totalExtraPaid).toBeGreaterThan(0);
  });

  it("simulates ₹10,000 extra/month", () => {
    const result = simulate(10_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newTenureMonths).toBeLessThan(result.comparison.previousTenureMonths);
  });

  it("defaults to reduce-tenure strategy", () => {
    const result = monthlyExtraPaymentSimulator.simulate({
      loan: baseLoan,
      monthlyExtraAmount: 5_000,
      startMonthIndex: 0
    });
    expect(result.method).toBe("reduce-tenure");
    expect(result.comparison.newEmi).toBe(result.comparison.previousEmi);
  });

  it("supports reduce-emi strategy", () => {
    const result = simulate(5_000, "reduce-emi");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newEmi).toBeLessThanOrEqual(result.comparison.previousEmi);
  });

  it("supports fixed-rate loan", () => {
    const result = simulate(5_000, "reduce-tenure", { rateType: "fixed", annualInterestRate: 8.6 });
    expect(result.validation.valid).toBe(true);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("supports floating-rate loan using latest supplied rate", () => {
    const result = simulate(5_000, "reduce-tenure", {
      rateType: "floating",
      annualInterestRate: 9.1
    });
    expect(result.validation.valid).toBe(true);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("accepts calendar startMonth and endMonth", () => {
    const result = simulate(5_000, "reduce-tenure", {}, {
      startMonth: "2026-07",
      endMonth: "2026-12"
    });
    expect(result.validation.valid).toBe(true);
    expect(result.totalExtraPaid).toBeLessThanOrEqual(5_000 * 6);
  });

  it("stops extra payment after configured end month", () => {
    const result = simulate(5_000, "reduce-tenure", {}, { endMonthIndex: 11 });
    expect(result.validation.valid).toBe(true);
    expect(result.totalExtraPaid).toBeLessThanOrEqual(5_000 * 12);
  });

  it("closes loan before configured end month when extra is large", () => {
    const result = simulate(200_000, "reduce-tenure", {
      outstandingPrincipal: 500_000,
      remainingTenureMonths: 120
    }, { endMonthIndex: 60 });
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newTenureMonths).toBeLessThan(60);
    expect(result.comparison.newOutstanding).toBe(0);
  });

  it("handles extra payment greater than remaining principal in first month", () => {
    const result = simulate(100_000, "reduce-tenure", {
      outstandingPrincipal: 80_000,
      remainingTenureMonths: 24,
      monthlyEmi: 4_000
    });
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newOutstanding).toBe(0);
    expect(result.totalExtraPaid).toBeLessThanOrEqual(80_000);
  });

  it("returns full simulation output shape", () => {
    const result = simulate(5_000, "reduce-tenure");
    expect(result.currentSummary).toBeDefined();
    expect(result.simulatedSummary).toBeDefined();
    expect(result.effectiveAnnualSavings).toBeGreaterThanOrEqual(0);
    expect(result.explanation.recommendation).toBeTruthy();
    expect(result.explanation.confidence).toBeTruthy();
  });

  it("does not mutate the original loan snapshot", () => {
    const loan = { ...baseLoan };
    simulate(5_000, "reduce-tenure", loan);
    expect(loan.outstandingPrincipal).toBe(baseLoan.outstandingPrincipal);
  });

  it("defers recommendation when payment cannot be maintained consistently", () => {
    const result = monthlyExtraPaymentSimulator.simulate({
      loan: baseLoan,
      monthlyExtraAmount: 5_000,
      startMonthIndex: 0,
      recommendationContext: {
        emergencyBuffer: 240_000,
        minimumEmergencyBuffer: 100_000,
        monthlyCashFlow: 26_350,
        canMaintainConsistently: false
      }
    });
    expect(result.explanation.suitable).toBe(false);
    expect(result.explanation.reasons.some((r) => r.includes("consistently"))).toBe(true);
  });
});
