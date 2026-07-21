import { describe, expect, it } from "vitest";
import { ProductCreationTypeId } from "@/products/creation";
import {
  buildFamilyProductTypeSummaries,
  buildFinancialFamilySummaries,
  FINANCIAL_FAMILY_CATALOG,
  FAMILY_PRODUCT_TYPES,
  FinancialFamilyId,
  getFamilyProductTypeDefinition,
  isFinancialFamilyId,
  loanMatchesCreationType,
  parseFamilyProductTypeRoute,
  resolveLegacyProductTypeRedirect
} from "@/products/families";
import { ProductTypeId } from "@/shared/domain/product";
import type { Loan } from "@/shared/domain/finance";

const sampleHomeLoan = {
  id: "loan-1",
  type: "home",
  status: "active",
  name: "Home",
  lender: "HDFC",
  outstandingBalance: 1_000_000,
  monthlyEmi: 10_000,
  annualInterestRate: 8,
  remainingTenureMonths: 120,
  nextDueDate: "2026-08-01",
  originalAmount: 2_000_000,
  principalPaid: 1_000_000,
  isOverdue: false
} as Loan;

describe("Financial Families IA", () => {
  it("freezes the five-family product hierarchy", () => {
    expect(FINANCIAL_FAMILY_CATALOG.map((entry) => entry.familyId)).toEqual([
      FinancialFamilyId.LOANS,
      FinancialFamilyId.SAVINGS,
      FinancialFamilyId.INVESTMENTS,
      FinancialFamilyId.COMMUNITY_FINANCE,
      FinancialFamilyId.INSURANCE
    ]);
  });

  it("places gold loan under the loans family", () => {
    const goldLoanType = getFamilyProductTypeDefinition(ProductCreationTypeId.GOLD_LOAN);
    expect(goldLoanType?.familyId).toBe(FinancialFamilyId.LOANS);
  });

  it("groups savings and investment placeholders under their families", () => {
    const savingsTypes = FAMILY_PRODUCT_TYPES.filter(
      (entry) => entry.familyId === FinancialFamilyId.SAVINGS
    ).map((entry) => entry.creationTypeId);

    expect(savingsTypes).toEqual([
      ProductCreationTypeId.FIXED_DEPOSITS,
      ProductCreationTypeId.RECURRING_DEPOSITS,
      ProductCreationTypeId.PPF,
      ProductCreationTypeId.NPS
    ]);
  });

  it("computes family and type counts dynamically", () => {
    const summaries = buildFinancialFamilySummaries([sampleHomeLoan], []);
    const loansSummary = summaries.find((entry) => entry.familyId === FinancialFamilyId.LOANS);

    expect(loansSummary?.activeProductCount).toBe(1);
    expect(loansSummary?.countLabel).toBe("1 Active");

    const loanTypes = buildFamilyProductTypeSummaries(FinancialFamilyId.LOANS, [sampleHomeLoan], []);
    const homeLoanType = loanTypes.find(
      (entry) => entry.creationTypeId === ProductCreationTypeId.HOME_LOAN
    );

    expect(homeLoanType?.activeCount).toBe(1);
    expect(homeLoanType?.countLabel).toBe("1 Active");
  });

  it("shows coming soon on investment and insurance family cards when empty", () => {
    const summaries = buildFinancialFamilySummaries([], []);
    const investments = summaries.find((entry) => entry.familyId === FinancialFamilyId.INVESTMENTS);
    const insurance = summaries.find((entry) => entry.familyId === FinancialFamilyId.INSURANCE);
    const loans = summaries.find((entry) => entry.familyId === FinancialFamilyId.LOANS);

    expect(investments?.countLabel).toBe("Coming Soon");
    expect(insurance?.countLabel).toBe("Coming Soon");
    expect(investments?.isNavigable).toBe(false);
    expect(insurance?.isNavigable).toBe(false);
    expect(loans?.isNavigable).toBe(true);
  });

  it("redirects legacy product type routes to family navigation", () => {
    expect(resolveLegacyProductTypeRedirect(ProductTypeId.GOLD_LOANS)).toBe(
      "/products/loans/gold-loan"
    );
    expect(resolveLegacyProductTypeRedirect(ProductTypeId.CHITS)).toBe(
      "/products/community-finance/chit"
    );
    expect(resolveLegacyProductTypeRedirect(ProductTypeId.FIXED_DEPOSITS)).toBe("/products/savings");
    expect(resolveLegacyProductTypeRedirect(ProductTypeId.LOANS)).toBeNull();
    expect(resolveLegacyProductTypeRedirect(ProductTypeId.INVESTMENTS)).toBeNull();
  });

  it("parses family product type routes", () => {
    expect(parseFamilyProductTypeRoute("loans", "home-loan")).toEqual({
      familyId: FinancialFamilyId.LOANS,
      creationTypeId: ProductCreationTypeId.HOME_LOAN
    });
    expect(parseFamilyProductTypeRoute("loans", "loan-uuid")).toBeNull();
    expect(isFinancialFamilyId("loans")).toBe(true);
    expect(isFinancialFamilyId("gold-loans")).toBe(false);
  });

  it("filters loans by creation type", () => {
    expect(loanMatchesCreationType(sampleHomeLoan, ProductCreationTypeId.HOME_LOAN)).toBe(true);
    expect(loanMatchesCreationType(sampleHomeLoan, ProductCreationTypeId.GOLD_LOAN)).toBe(false);
  });
});
