import { describe, expect, it } from "vitest";
import {
  calculateEmi,
  calculateTenureMonths,
  monthlyInterestRate
} from "@/engines/loan/home-loan/core/math";
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";

const bankingTestSnapshot: HomeLoanSimulationSnapshot = {
  outstandingPrincipal: 2_200_000,
  monthlyEmi: calculateEmi(2_200_000, 12.35, 300),
  annualInterestRate: 12.35,
  remainingTenureMonths: 300,
  loanStartDate: "2020-01-01",
  emiPaymentDay: 5,
  asOfDate: "2026-07-07"
};

describe("Home Loan Amortization Engine", () => {
  it("computes monthly interest rate as annual / 12 / 100", () => {
    expect(monthlyInterestRate(12)).toBeCloseTo(0.01, 10);
    expect(monthlyInterestRate(12.35)).toBeCloseTo(0.1235 / 12 / 100, 10);
  });

  it("uses the standard EMI formula", () => {
    const emi = calculateEmi(2_200_000, 12.35, 300);
    expect(emi).toBeGreaterThan(0);

    const r = monthlyInterestRate(12.35);
    const factor = Math.pow(1 + r, 300);
    const expected = (2_200_000 * r * factor) / (factor - 1);
    expect(emi).toBeCloseTo(expected, 6);
  });

  it("generates a complete baseline schedule until closure", () => {
    const schedule = homeLoanAmortizationEngine.projectBaseline(bankingTestSnapshot);

    expect(schedule.rows.length).toBeGreaterThan(0);
    expect(schedule.rows.at(-1)?.closingBalance).toBe(0);
    expect(schedule.totalInterest).toBeGreaterThan(0);
    expect(schedule.rows.every((row) => row.cumulativeInterest >= row.interest)).toBe(true);
  });

  it("derives interest saved from schedule sums for ₹1,00,000 lump sum", () => {
    const comparison = homeLoanAmortizationEngine.comparePrepaymentStrategies(
      bankingTestSnapshot,
      100_000
    );

    expect(comparison.reduceTenure.valid).toBe(true);
    expect(comparison.reduceEmi.valid).toBe(true);

    const tenureInterestSaved =
      comparison.reduceTenure.comparison.original.totalInterest -
      comparison.reduceTenure.comparison.simulated.totalInterest;
    const emiInterestSaved =
      comparison.reduceEmi.comparison.original.totalInterest -
      comparison.reduceEmi.comparison.simulated.totalInterest;

    expect(comparison.reduceTenure.interestSaved).toBeCloseTo(tenureInterestSaved, 6);
    expect(comparison.reduceEmi.interestSaved).toBeCloseTo(emiInterestSaved, 6);
    expect(comparison.reduceTenure.interestSaved).toBeGreaterThan(comparison.reduceEmi.interestSaved);
  });

  it("keeps EMI unchanged for reduce tenure strategy", () => {
    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot: bankingTestSnapshot,
      paymentAmount: 100_000,
      strategy: "reduce-tenure"
    });

    expect(result.newEmi).toBe(bankingTestSnapshot.monthlyEmi);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("keeps tenure unchanged for reduce EMI strategy", () => {
    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot: bankingTestSnapshot,
      paymentAmount: 100_000,
      strategy: "reduce-emi"
    });

    expect(result.newEmi).toBeLessThan(bankingTestSnapshot.monthlyEmi);
    expect(result.comparison.simulated.tenureMonths).toBeLessThanOrEqual(
      bankingTestSnapshot.remainingTenureMonths
    );
  });

  it("calculates reduce-tenure months using the specified formula", () => {
    const newOutstanding = 2_100_000;
    const tenure = calculateTenureMonths(
      newOutstanding,
      bankingTestSnapshot.annualInterestRate,
      bankingTestSnapshot.monthlyEmi
    );

    expect(tenure).toBeGreaterThan(0);
    expect(Number.isInteger(tenure)).toBe(true);
  });

  it("simulates monthly extra payment from schedule rows", () => {
    const result = homeLoanAmortizationEngine.simulateMonthlyExtra({
      snapshot: bankingTestSnapshot,
      monthlyExtraAmount: 5_000,
      strategy: "reduce-tenure"
    });

    expect(result.valid).toBe(true);
    expect(result.totalExtraPaid).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("handles foreclosure when payment equals outstanding", () => {
    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot: bankingTestSnapshot,
      paymentAmount: bankingTestSnapshot.outstandingPrincipal,
      strategy: "reduce-tenure"
    });

    expect(result.kind).toBe("foreclosure");
    expect(result.newOutstanding).toBe(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("rejects invalid simulations", () => {
    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot: { ...bankingTestSnapshot, outstandingPrincipal: 0 },
      paymentAmount: 100_000,
      strategy: "reduce-tenure"
    });

    expect(result.valid).toBe(false);
  });

  it("returns debug report when debug mode is enabled", () => {
    const result = homeLoanAmortizationEngine.simulateLumpSum({
      snapshot: bankingTestSnapshot,
      paymentAmount: 100_000,
      strategy: "reduce-tenure",
      debug: true
    });

    expect(result.debug).toBeDefined();
    expect(result.debug?.originalSchedule.rows.length).toBeGreaterThan(0);
    expect(result.debug?.simulationSchedule.rows.length).toBeGreaterThan(0);
    expect(result.debug?.monthComparisons.length).toBeGreaterThan(0);
  });

  it("recommends reduce tenure when it saves more interest", () => {
    const comparison = homeLoanAmortizationEngine.comparePrepaymentStrategies(
      bankingTestSnapshot,
      100_000,
      { emiAffordable: true, prioritizeCashFlow: false }
    );

    expect(comparison.recommendation.preferredStrategy).toBe("reduce-tenure");
    expect(comparison.comparison.interestSavedDelta).toBeGreaterThan(0);
  });
});
