/**
 * Home Loan Engine — architecture tests.
 */

import { describe, it, expect } from "vitest";
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import { calculateEmi } from "@/engines/loan/home-loan/core/math";
import { snapshotFromPersistedLoan } from "@/engines/loan/home-loan/adapters/from-persisted-loan";
import type { Loan } from "@/shared/domain/finance";

describe("Home Loan Engine architecture", () => {
  it("exports the amortization engine facade", () => {
    expect(homeLoanAmortizationEngine).toBeDefined();
    expect(typeof homeLoanAmortizationEngine.simulateLumpSum).toBe("function");
    expect(typeof homeLoanAmortizationEngine.simulateMonthlyExtra).toBe("function");
    expect(typeof homeLoanAmortizationEngine.comparePrepaymentStrategies).toBe("function");
  });

  it("calculates EMI deterministically from core math", () => {
    const emi = calculateEmi(1_000_000, 8.5, 240);
    expect(emi).toBeGreaterThan(0);
  });

  it("maps persisted loans to simulation snapshots without original amount", () => {
    const loan: Loan = {
      id: "home-1",
      name: "Home",
      type: "home",
      lender: "Bank",
      originalAmount: 5_000_000,
      outstandingBalance: 2_200_000,
      annualInterestRate: 12.35,
      monthlyEmi: 25_000,
      principalPaid: 2_800_000,
      interestPaid: 0,
      remainingTenureMonths: 300,
      estimatedClosureDate: "2045-01-01",
      nextDueDate: "2026-07-05",
      loanStartDate: "2020-01-01",
      originalLoanTenureMonths: 360,
      emiPaymentDay: 5
    };

    const snapshot = snapshotFromPersistedLoan(loan);
    expect(snapshot.outstandingPrincipal).toBe(2_200_000);
    expect(snapshot).not.toHaveProperty("originalAmount");
  });
});
