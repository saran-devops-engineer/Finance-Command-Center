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

function runAnnualExtra(annualExtraAmount: number, paymentMonth = 12, debug = false) {
  return homeLoanAmortizationEngine.simulateAnnualExtra({
    snapshot,
    annualExtraAmount,
    paymentMonth,
    debug
  });
}

describe("Annual Extra Payment simulation", () => {
  const testAmounts = [50_000, 100_000, 200_000, 500_000];

  it("always closes the loan earlier than the original schedule (every December)", () => {
    const baselineMonths = homeLoanAmortizationEngine.projectBaseline(snapshot).tenureMonths;

    for (const amount of testAmounts) {
      const result = runAnnualExtra(amount, 12);
      expect(result.valid).toBe(true);
      expect(result.monthsSaved).toBeGreaterThan(0);
      expect(result.newTenureMonths).toBeLessThan(baselineMonths);
    }
  });

  it("increases interest saved as the annual extra increases", () => {
    const savings = testAmounts.map((amount) => runAnnualExtra(amount, 12).interestSaved);

    for (let index = 1; index < savings.length; index += 1) {
      expect(savings[index]).toBeGreaterThan(savings[index - 1]);
    }
  });

  it("keeps the EMI unchanged (annual extra never reduces EMI)", () => {
    const result = runAnnualExtra(100_000, 12);
    expect(result.strategy).toBe("reduce-tenure");
    expect(result.newEmi).toBe(snapshot.monthlyEmi);
  });

  it("applies the extra only in the configured month, once per year", () => {
    const result = runAnnualExtra(100_000, 12);
    const paidRows = result.comparison.simulated.rows.filter((row) => row.extraPayment > 0);

    expect(paidRows.length).toBe(result.annualPaymentsMade);
    expect(result.annualPaymentsMade).toBeGreaterThan(0);

    const everyPaidRowIsDecember = paidRows.every(
      (row) => new Date(`${row.paymentDate}T00:00:00`).getMonth() + 1 === 12
    );
    expect(everyPaidRowIsDecember).toBe(true);
  });

  it("derives interest saved from schedule sums, not shortcuts", () => {
    const result = runAnnualExtra(100_000, 12);
    const derived =
      result.comparison.original.totalInterest - result.comparison.simulated.totalInterest;
    expect(result.interestSaved).toBeCloseTo(derived, 6);
  });

  it("never lets the closing balance go negative and settles to zero", () => {
    const result = runAnnualExtra(500_000, 12);
    expect(result.comparison.simulated.rows.every((row) => row.closingBalance >= 0)).toBe(true);
    expect(result.comparison.simulated.rows.at(-1)?.closingBalance).toBe(0);
  });

  it("reports total extra paid equal to the summed applied payments", () => {
    const result = runAnnualExtra(100_000, 12);
    const summedExtra = result.comparison.simulated.rows.reduce(
      (sum, row) => sum + row.extraPayment,
      0
    );
    expect(result.totalExtraPaid).toBeCloseTo(summedExtra, 6);
  });

  it("rejects an annual extra greater than or equal to the outstanding", () => {
    const result = runAnnualExtra(snapshot.outstandingPrincipal, 12);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects a non-positive annual extra", () => {
    const result = runAnnualExtra(0, 12);
    expect(result.valid).toBe(false);
  });

  it("exposes a month-by-month debug report when enabled", () => {
    const result = runAnnualExtra(100_000, 12, true);
    expect(result.debug).toBeDefined();
    expect(result.debug?.simulationSchedule.rows.length).toBeGreaterThan(0);
  });
});
