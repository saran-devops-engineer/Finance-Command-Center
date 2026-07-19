import { describe, expect, it } from "vitest";
import {
  calculateTotalMonthlyIncome,
  createSimpleIncomeProfile,
  CommandCenterQuestion,
  DataSchemaVersion,
  CURRENT_DATA_SCHEMA_VERSION,
  VisibleDomain,
  DOMAIN_PRIMARY_QUESTION,
  ProductTypeId,
  CommitmentSourceKind,
  IncomeMode
} from "@/shared/domain";
import {
  PRODUCT_TYPE_CATALOG,
  isActiveProductType,
  isComingSoonProductType,
  isKnownProductTypeId
} from "@/products";
import { getActiveNavDomain, AppRoute } from "@/navigation";

describe("FCC V2 domain model", () => {
  it("defines five visible domains", () => {
    expect(Object.keys(VisibleDomain)).toHaveLength(5);
    expect(VisibleDomain.PRODUCTS).toBe("products");
    expect(VisibleDomain.COMMITMENTS).toBe("commitments");
  });

  it("maps each visible domain to a command-center question", () => {
    expect(DOMAIN_PRIMARY_QUESTION[VisibleDomain.PRODUCTS]).toBe(CommandCenterQuestion.WHAT_DO_I_OWE);
    expect(DOMAIN_PRIMARY_QUESTION[VisibleDomain.COMMITMENTS]).toBe(
      CommandCenterQuestion.WHAT_MUST_I_PAY_NEXT
    );
  });

  it("uses V2 as the live schema version after Phase 2", () => {
    expect(CURRENT_DATA_SCHEMA_VERSION).toBe(DataSchemaVersion.V2);
  });

  it("calculates total monthly income in simple mode", () => {
    const profile = createSimpleIncomeProfile(85000);
    expect(calculateTotalMonthlyIncome(profile)).toBe(85000);
    expect(profile.mode).toBe(IncomeMode.SIMPLE);
  });

  it("calculates total monthly income in advanced mode", () => {
    const profile = createSimpleIncomeProfile(0);
    profile.mode = IncomeMode.ADVANCED;
    profile.sources = [
      {
        id: "1",
        kind: "salary",
        label: "Salary",
        monthlyAmount: 70000,
        isPrimary: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "2",
        kind: "rental",
        label: "Rental",
        monthlyAmount: 15000,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ];

    expect(calculateTotalMonthlyIncome(profile)).toBe(85000);
  });
});

describe("FCC V2 product registry", () => {
  it("registers active and coming-soon product types", () => {
    expect(isActiveProductType(ProductTypeId.LOANS)).toBe(true);
    expect(isActiveProductType(ProductTypeId.CHITS)).toBe(true);
    expect(isComingSoonProductType(ProductTypeId.INVESTMENTS)).toBe(true);
    expect(isComingSoonProductType(ProductTypeId.INSURANCE)).toBe(true);
  });

  it("includes architecture placeholders for future products", () => {
    const comingSoon = PRODUCT_TYPE_CATALOG.filter((entry) => entry.availability === "coming-soon");
    expect(comingSoon.map((entry) => entry.productTypeId)).toEqual([
      ProductTypeId.INVESTMENTS,
      ProductTypeId.FIXED_DEPOSITS,
      ProductTypeId.RECURRING_DEPOSITS,
      ProductTypeId.PPF,
      ProductTypeId.NPS,
      ProductTypeId.INSURANCE
    ]);
  });

  it("validates product type path segments", () => {
    expect(isKnownProductTypeId("loans")).toBe(true);
    expect(isKnownProductTypeId("gold-loans")).toBe(true);
    expect(isKnownProductTypeId("invalid")).toBe(false);
  });
});

describe("FCC V2 navigation", () => {
  it("highlights Products for legacy loan and chit routes", () => {
    expect(getActiveNavDomain("/products")).toBe(VisibleDomain.PRODUCTS);
    expect(getActiveNavDomain("/products/loans")).toBe(VisibleDomain.PRODUCTS);
    expect(getActiveNavDomain("/loans")).toBe(VisibleDomain.PRODUCTS);
    expect(getActiveNavDomain("/chits")).toBe(VisibleDomain.PRODUCTS);
  });

  it("highlights Commitments for legacy money route", () => {
    expect(getActiveNavDomain(AppRoute.COMMITMENTS)).toBe(VisibleDomain.COMMITMENTS);
    expect(getActiveNavDomain(AppRoute.MONEY)).toBe(VisibleDomain.COMMITMENTS);
  });
});

describe("FCC V2 commitment domain", () => {
  it("defines product-generated vs manual source kinds", () => {
    expect(CommitmentSourceKind.PRODUCT_GENERATED).toBe("product-generated");
    expect(CommitmentSourceKind.MANUAL).toBe("manual");
    expect(CommitmentSourceKind.LEGACY_MIGRATED).toBe("legacy-migrated");
  });
});
