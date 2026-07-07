import { describe, expect, it } from "vitest";
import { lumpSumOneTimePaymentSimulator } from "@/engines/loan/home-loan/simulators/lump-sum-one-time-payment";
import { validateLumpSumSimulation } from "@/engines/loan/home-loan/validators/lump-sum-validation";
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
  lumpSumAmount: number,
  method: "reduce-tenure" | "reduce-emi" = "reduce-tenure",
  overrides: Partial<HomeLoanSnapshot> = {}
) {
  return lumpSumOneTimePaymentSimulator.simulate({
    loan: { ...baseLoan, ...overrides },
    lumpSumAmount,
    paymentDate: "2026-07-07",
    method,
    recommendationContext: {
      emergencyBuffer: 240_000,
      minimumEmergencyBuffer: 100_000,
      monthlyCashFlow: 26_350
    }
  });
}

describe("Rule Set 01 — lump sum validation", () => {
  it("rejects zero payment", () => {
    const result = validateLumpSumSimulation({
      loan: baseLoan,
      lumpSumAmount: 0,
      paymentDate: "2026-07-07"
    });
    expect(result.valid).toBe(false);
  });

  it("rejects negative payment", () => {
    const result = validateLumpSumSimulation({
      loan: baseLoan,
      lumpSumAmount: -1,
      paymentDate: "2026-07-07"
    });
    expect(result.valid).toBe(false);
  });

  it("rejects payment greater than outstanding", () => {
    const result = validateLumpSumSimulation({
      loan: baseLoan,
      lumpSumAmount: baseLoan.outstandingPrincipal + 1,
      paymentDate: "2026-07-07"
    });
    expect(result.valid).toBe(false);
  });

  it("rejects archived loans", () => {
    const result = validateLumpSumSimulation({
      loan: { ...baseLoan, status: "archived" },
      lumpSumAmount: 50_000,
      paymentDate: "2026-07-07"
    });
    expect(result.valid).toBe(false);
  });
});

describe("Rule Set 01 — lump sum simulation", () => {
  it("simulates ₹50,000 reduce-tenure payment", () => {
    const result = simulate(50_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newOutstanding).toBe(3_770_000);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("simulates ₹1,00,000 payment", () => {
    const result = simulate(100_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newOutstanding).toBe(3_720_000);
  });

  it("simulates ₹5,00,000 payment", () => {
    const result = simulate(500_000, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newOutstanding).toBe(3_320_000);
  });

  it("handles payment equals outstanding as foreclosure", () => {
    const result = simulate(baseLoan.outstandingPrincipal, "reduce-tenure");
    expect(result.validation.valid).toBe(true);
    expect(result.isForeclosure).toBe(true);
    expect(result.comparison.newOutstanding).toBe(0);
    expect(result.explanation.recommendation).toBe("Foreclosure");
  });

  it("supports reduce-emi strategy", () => {
    const result = simulate(100_000, "reduce-emi");
    expect(result.validation.valid).toBe(true);
    expect(result.comparison.newEmi).toBeLessThan(result.comparison.previousEmi);
    expect(result.comparison.newTenureMonths).toBe(result.comparison.previousTenureMonths);
  });

  it("supports floating-rate loan using latest supplied rate", () => {
    const result = simulate(100_000, "reduce-tenure", {
      rateType: "floating",
      annualInterestRate: 9.1
    });
    expect(result.validation.valid).toBe(true);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("does not mutate the original loan snapshot", () => {
    const loan = { ...baseLoan };
    simulate(50_000, "reduce-tenure", loan);
    expect(loan.outstandingPrincipal).toBe(baseLoan.outstandingPrincipal);
    expect(loan.monthlyEmi).toBe(baseLoan.monthlyEmi);
  });

  it("returns structured explanation object", () => {
    const result = simulate(100_000, "reduce-tenure");
    expect(result.explanation.summary).toBeTruthy();
    expect(result.explanation.recommendation).toBeTruthy();
    expect(result.explanation.confidence).toBeTruthy();
    expect(Array.isArray(result.explanation.reasons)).toBe(true);
  });
});
