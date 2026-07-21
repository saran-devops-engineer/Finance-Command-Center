import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import { trackLoanCreatedEvent, trackLoanUpdatedEvent } from "@/core/analytics/loan-analytics-events";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import type { FinanceRepository } from "@/core/repository/finance-repository";
import {
  requireProductCreationDefinition,
  type ProductCreationTypeIdValue,
  type ProductFormValues,
  type ProductSaveResult
} from "@/products/creation";
import { getProductRouteConfig } from "@/products/registry";
import { buildProductDetailPath } from "@/products/types";
import { saveChitUpdate } from "@/services/chit-management/chit-lifecycle";
import { saveLoanUpdate, syncLoanCommitments } from "@/services/loan-management/loan-lifecycle";
import type { Chit } from "@/shared/domain/chit";
import type { Loan } from "@/shared/domain/finance";

function loanRedirectPath(productTypeId: string, loanId: string) {
  const config = getProductRouteConfig(productTypeId as "loans");
  const template = config.legacyDetailPathTemplate ?? config.detailPathTemplate;
  return buildProductDetailPath(template, loanId);
}

function chitRedirectPath(chitId: string) {
  const config = getProductRouteConfig("chits");
  const template = config.legacyDetailPathTemplate ?? config.detailPathTemplate;
  return buildProductDetailPath(template, chitId);
}

export async function saveCreatedProduct(params: {
  repository: FinanceRepository;
  creationTypeId: ProductCreationTypeIdValue;
  form?: ProductFormValues;
  loan?: Loan;
  existingLoan?: Loan | null;
}): Promise<ProductSaveResult> {
  const definition = requireProductCreationDefinition(params.creationTypeId);
  const loan =
    params.loan ??
    (params.form && definition.buildLoan
      ? definition.buildLoan(params.form, params.existingLoan ?? undefined)
      : null);

  if (!loan) {
    throw new Error("Loan payload is required.");
  }

  const isUpdate = Boolean(params.existingLoan);

  if (isUpdate) {
    await saveLoanUpdate(params.repository, params.existingLoan!, loan);
    trackLoanUpdatedEvent(loan);
    trackApplicationEvent(AppEvent.PRODUCT_UPDATED, {
      product_type: definition.catalog.productTypeId,
      product_id: loan.id
    });
  } else {
    await params.repository.saveLoan(loan);
    await syncLoanCommitments(params.repository, null, loan);
    trackLoanCreatedEvent(loan);
    trackApplicationEvent(AppEvent.PRODUCT_CREATED, {
      product_type: definition.catalog.productTypeId,
      product_id: loan.id
    });
  }

  notifyFinanceDataUpdated("loan");

  return {
    productTypeId: definition.catalog.productTypeId,
    productId: loan.id,
    creationTypeId: params.creationTypeId,
    redirectPath: loanRedirectPath(definition.catalog.productTypeId, loan.id)
  };
}

export async function saveCreatedChit(params: {
  repository: FinanceRepository;
  chit: Chit;
  previousChit?: Chit | null;
}): Promise<ProductSaveResult> {
  const isUpdate = Boolean(params.previousChit);
  await saveChitUpdate(params.repository, params.previousChit ?? null, params.chit);

  if (isUpdate) {
    trackApplicationEvent(AppEvent.PRODUCT_UPDATED, {
      product_type: "chits",
      product_id: params.chit.id
    });
  } else {
    trackApplicationEvent(AppEvent.CHIT_CREATED, { chit_id: params.chit.id });
    trackApplicationEvent(AppEvent.PRODUCT_CREATED, {
      product_type: "chits",
      product_id: params.chit.id
    });
  }

  return {
    productTypeId: "chits",
    productId: params.chit.id,
    creationTypeId: "chit",
    redirectPath: chitRedirectPath(params.chit.id)
  };
}

export function trackProductSelected(creationTypeId: ProductCreationTypeIdValue) {
  trackApplicationEvent(AppEvent.PRODUCT_SELECTED, {
    product_type: creationTypeId
  });
}

export function trackProductValidationFailed(creationTypeId: ProductCreationTypeIdValue) {
  trackApplicationEvent(AppEvent.PRODUCT_VALIDATION_FAILED, {
    product_type: creationTypeId
  });
}

export function trackProductCreationCancelled(creationTypeId: ProductCreationTypeIdValue | null) {
  trackApplicationEvent(AppEvent.PRODUCT_CREATION_CANCELLED, {
    product_type: creationTypeId ?? undefined
  });
}
