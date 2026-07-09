import { describe, expect, it } from "vitest";
import { calculateEmi } from "@/engines/loan/home-loan/core/math";
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";

const snapshot: HomeLoanSimulationSnapshot = {
  outstandingPrincipal: 2_200_000,
  monthlyEmi: calculateEmi(2_200_000, 12.35, 300),
  annualInterestRate: 12.35,
  remainingTenureMonths: 300,
  loanStartDate: "2020-01-01",
  emiPaymentDay: 5,
  asOfDate: "2026-07-07"
};

function runMonthlyExtra(monthlyExtraAmount: number, debug = false) {
  return homeLoanAmortizationEngine.simulateMonthlyExtra({
    snapshot,
    monthlyExtraAmount,
    strategy: "reduce-tenure",
    debug
  });
}

describe("Monthly Extra Payment simulation", () => {
  const testAmounts = [1_000, 2_000, 5_000, 10_000];

  it("always closes the loan earlier than the original schedule", () => {
    const baselineMonths = homeLoanAmortizationEngine.projectBaseline(snapshot).tenureMonths;

    for (const amount of testAmounts) {
      const result = runMonthlyExtra(amount);
      expect(result.valid).toBe(true);
      expect(result.monthsSaved).toBeGreaterThan(0);
      expect(result.newTenureMonths).toBeLessThan(baselineMonths);
    }
  });

  it("increases interest saved as the monthly extra increases", () => {
    const savings = testAmounts.map((amount) => runMonthlyExtra(amount).interestSaved);

    for (let index = 1; index < savings.length; index += 1) {
      expect(savings[index]).toBeGreaterThan(savings[index - 1]);
    }
  });

  it("keeps the EMI unchanged (monthly extra never reduces EMI)", () => {
    const result = runMonthlyExtra(5_000);
    expect(result.strategy).toBe("reduce-tenure");
    expect(result.newEmi).toBe(snapshot.monthlyEmi);
  });

  it("derives interest saved from schedule sums, not shortcuts", () => {
    const result = runMonthlyExtra(5_000);
    const derived =
      result.comparison.original.totalInterest - result.comparison.simulated.totalInterest;
    expect(result.interestSaved).toBeCloseTo(derived, 6);
  });

  it("never lets the closing balance go negative and settles to zero", () => {
    const result = runMonthlyExtra(10_000);
    const lastRow = result.comparison.simulated.rows.at(-1);
    expect(result.comparison.simulated.rows.every((row) => row.closingBalance >= 0)).toBe(true);
    expect(lastRow?.closingBalance).toBe(0);
  });

  it("applies the extra every month and reports total extra paid", () => {
    const result = runMonthlyExtra(5_000);
    const summedExtra = result.comparison.simulated.rows.reduce(
      (sum, row) => sum + row.extraPayment,
      0
    );
    expect(result.totalExtraPaid).toBeCloseTo(summedExtra, 6);
    expect(result.totalExtraPaid).toBeGreaterThan(0);
  });

  it("rejects a monthly extra that is greater than or equal to the outstanding", () => {
    const result = runMonthlyExtra(snapshot.outstandingPrincipal);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects a non-positive monthly extra", () => {
    const result = runMonthlyExtra(0);
    expect(result.valid).toBe(false);
  });

  it("exposes a month-by-month debug report when enabled", () => {
    const result = runMonthlyExtra(5_000, true);
    expect(result.debug).toBeDefined();
    expect(result.debug?.simulationSchedule.rows.length).toBeGreaterThan(0);
  });
});
