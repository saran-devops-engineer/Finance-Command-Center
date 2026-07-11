import { describe, expect, it } from "vitest";
import { buildFinancialCommitments } from "@/engines/commitment";
import { generateFinancialInsights } from "@/engines/financial-insights";
import type { Loan, MoneyBreakdown } from "@/shared/domain/finance";

const referenceDate = "2026-07-10";

const moneyBreakdown: MoneyBreakdown = {
  monthlyIncome: 150000,
  mandatoryExpenses: 45000,
  emis: 52000,
  loanPayments: 52000,
  insurance: 8000,
  rent: 0,
  utilityBills: 6000,
  fixedCommitments: 66000,
  emergencyBuffer: 20000
};

function baseLoan(overrides: Partial<Loan>): Loan {
  return {
    id: "loan-base",
    name: "Loan",
    type: "personal",
    lender: "Bank",
    originalAmount: 100000,
    outstandingBalance: 100000,
    annualInterestRate: 12,
    monthlyEmi: 5000,
    principalPaid: 0,
    interestPaid: 0,
    remainingTenureMonths: 24,
    estimatedClosureDate: "",
    nextDueDate: "2026-07-20",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("Financial Insights Engine", () => {
  it("creates a savings recommendation", () => {
    const loans = [
      baseLoan({
        id: "gold-yearly",
        type: "gold",
        goldInterestPaymentType: "yearly",
        renewalDate: "2027-05-01",
        nextDueDate: "2027-05-01",
        outstandingBalance: 500000,
        annualInterestRate: 12
      })
    ];
    const commitments = buildFinancialCommitments({ loans, referenceDate });
    const insights = generateFinancialInsights(
      { loans, moneyBreakdown, commitments, referenceDate },
      3
    );

    expect(insights.some((insight) => insight.category === "savings")).toBe(true);
  });

  it("creates a warning when this month commitments spike", () => {
    const loans = [
      baseLoan({
        id: "home-1",
        type: "home",
        monthlyEmi: 90000,
        nextDueDate: "2026-07-18",
        loanStartDate: "2018-03-05",
        emiPaymentDay: 5,
        outstandingBalance: 3200000,
        remainingTenureMonths: 120
      })
    ];
    const commitments = buildFinancialCommitments({ loans, referenceDate });
    const insights = generateFinancialInsights(
      { loans, moneyBreakdown, commitments, referenceDate },
      3
    );

    expect(insights.some((insight) => insight.category === "warning")).toBe(true);
  });

  it("creates a positive status insight when nothing urgent is due soon", () => {
    const loans = [
      baseLoan({
        id: "home-1",
        type: "home",
        monthlyEmi: 20000,
        nextDueDate: "2026-08-20",
        loanStartDate: "2018-03-05",
        emiPaymentDay: 5,
        outstandingBalance: 3200000,
        remainingTenureMonths: 120
      })
    ];
    const commitments = buildFinancialCommitments({ loans, referenceDate });
    const insights = generateFinancialInsights(
      { loans, moneyBreakdown, commitments, referenceDate },
      3
    );

    expect(insights.some((insight) => insight.category === "status")).toBe(true);
  });

  it("creates a home loan opportunity using simulator calculations", () => {
    const loans = [
      baseLoan({
        id: "home-1",
        type: "home",
        name: "Home Loan",
        monthlyEmi: 45200,
        nextDueDate: "2026-07-18",
        loanStartDate: "2018-03-05",
        emiPaymentDay: 5,
        outstandingBalance: 3820000,
        originalAmount: 4200000,
        annualInterestRate: 8.6,
        remainingTenureMonths: 180
      })
    ];
    const commitments = buildFinancialCommitments({ loans, referenceDate });
    const insights = generateFinancialInsights(
      { loans, moneyBreakdown, commitments, referenceDate },
      3
    );

    expect(insights.some((insight) => insight.category === "opportunity")).toBe(true);
  });

  it("returns at most three insights on the dashboard", () => {
    const loans = [
      baseLoan({
        id: "home-1",
        type: "home",
        monthlyEmi: 90000,
        nextDueDate: "2026-07-18",
        loanStartDate: "2018-03-05",
        emiPaymentDay: 5,
        outstandingBalance: 3820000,
        originalAmount: 4200000,
        annualInterestRate: 8.6,
        remainingTenureMonths: 180
      }),
      baseLoan({
        id: "gold-yearly",
        type: "gold",
        goldInterestPaymentType: "yearly",
        renewalDate: "2027-05-01",
        nextDueDate: "2027-05-01",
        outstandingBalance: 500000,
        annualInterestRate: 12
      })
    ];
    const commitments = buildFinancialCommitments({ loans, referenceDate });

    expect(
      generateFinancialInsights({ loans, moneyBreakdown, commitments, referenceDate }, 3)
    ).toHaveLength(3);
  });
});
