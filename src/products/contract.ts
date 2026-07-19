/**
 * FCC V2 — Product module contract.
 * Every financial product type must implement this interface to plug into FCC.
 */

import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import type { ProductReference, ProductTypeIdValue } from "@/shared/domain/product";

/** Pure calculation engine owned by each product type. */
export interface ProductCalculationEngine<TProduct = unknown> {
  readonly productTypeId: ProductTypeIdValue;
  /** Validate product data before persistence. */
  validate(product: TProduct): { valid: boolean; errors: string[] };
}

/** Generates recurring commitments from a product instance. */
export interface ProductCommitmentGenerator<TProduct = unknown> {
  readonly productTypeId: ProductTypeIdValue;
  generateCommitments(product: TProduct, referenceDate?: string): CommitmentRecord[];
}

/** Generates insights for a product instance. */
export interface ProductInsightGenerator<TProduct = unknown> {
  readonly productTypeId: ProductTypeIdValue;
  generateInsights(product: TProduct): ProductInsight[];
}

export interface ProductInsight {
  id: string;
  title: string;
  description: string;
  tone: "positive" | "warning" | "critical" | "neutral";
}

/** Product payment and lifecycle history. */
export interface ProductHistoryEntry {
  id: string;
  productId: string;
  occurredAt: string;
  kind: string;
  summary: string;
}

export interface ProductHistoryProvider<TProduct = unknown> {
  readonly productTypeId: ProductTypeIdValue;
  listHistory(product: TProduct): ProductHistoryEntry[];
}

/**
 * Complete product module contract.
 * Future products (FD, RD, Insurance) implement this and register in the product registry.
 */
export interface FinancialProductModule<TProduct = unknown> {
  productTypeId: ProductTypeIdValue;
  label: string;
  pluralLabel: string;
  description: string;
  calculationEngine: ProductCalculationEngine<TProduct>;
  commitmentGenerator: ProductCommitmentGenerator<TProduct>;
  insightGenerator: ProductInsightGenerator<TProduct>;
  historyProvider: ProductHistoryProvider<TProduct>;
  /** Map persisted entity to a navigation reference. */
  toProductReference(product: TProduct): ProductReference;
}

/** Placeholder module for product types not yet implemented. */
export interface ComingSoonProductModule {
  productTypeId: ProductTypeIdValue;
  label: string;
  pluralLabel: string;
  description: string;
  availability: "coming-soon";
}

export type RegisteredProductModule = FinancialProductModule | ComingSoonProductModule;

export function isActiveProductModule(
  module: RegisteredProductModule
): module is FinancialProductModule {
  return !("availability" in module);
}
