import { describe, expect, it } from "vitest";
import "@/products/creation";
import {
  getProductCreationDefinition,
  ProductCreationTypeId,
  PRODUCT_CREATION_CATALOG
} from "@/products/creation";

describe("Product Creation Framework", () => {
  it("registers active loan and chit creation definitions", () => {
    expect(getProductCreationDefinition(ProductCreationTypeId.HOME_LOAN)?.schema).toBeDefined();
    expect(getProductCreationDefinition(ProductCreationTypeId.PERSONAL_LOAN)?.schema).toBeDefined();
    expect(getProductCreationDefinition(ProductCreationTypeId.GOLD_LOAN)?.usesDedicatedForm).toBe(
      "gold-loan"
    );
    expect(getProductCreationDefinition(ProductCreationTypeId.CHIT)?.usesDedicatedForm).toBe("chit");
  });

  it("lists coming soon products as disabled in catalog", () => {
    const comingSoon = PRODUCT_CREATION_CATALOG.filter(
      (entry) => entry.availability === "coming-soon"
    );
    expect(comingSoon.length).toBeGreaterThanOrEqual(6);
    expect(comingSoon.some((entry) => entry.label === "Mutual Funds")).toBe(true);
  });

  it("validates home loan without redundant loan type field", () => {
    const definition = getProductCreationDefinition(ProductCreationTypeId.HOME_LOAN)!;
    const errors = definition.validate({
      name: "HDFC Home Loan",
      lenderPick: "HDFC Bank",
      lenderCustom: "",
      lender: "HDFC Bank",
      originalAmount: "5,000,000",
      loanStartDate: "2020-01-01",
      originalLoanTenureMonths: "240",
      annualInterestRate: "8.5",
      outstandingBalance: "4,000,000",
      monthlyEmi: "45,000",
      remainingTenureMonths: "180",
      emiPaymentDay: "5",
      remainingTenureManuallyOverridden: "false"
    });

    expect(errors.some((error) => error.includes("Loan type"))).toBe(false);
    expect(errors).toHaveLength(0);
  });

  it("maps personal loan creation type to personal loan storage type", () => {
    const definition = getProductCreationDefinition(ProductCreationTypeId.PERSONAL_LOAN)!;
    const loan = definition.buildLoan!({
      name: "My Personal Loan",
      lenderPick: "ICICI Bank",
      lenderCustom: "",
      lender: "ICICI Bank",
      originalAmount: "200,000",
      outstandingBalance: "150,000",
      annualInterestRate: "12",
      monthlyEmi: "8,000",
      remainingTenureMonths: "24",
      nextDueDate: "2026-08-01",
      notes: ""
    });

    expect(loan.type).toBe("personal");
  });
});
