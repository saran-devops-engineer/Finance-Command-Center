"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { spacing } from "@/lib/design-tokens";
import { financeRepository } from "@/repositories";
import "@/products/creation";
import {
  getCreationCatalogEntry,
  getProductCreationDefinition,
  ProductCreationTypeId,
  resolveCreationTypeFromLoanType,
  type ProductCreationTypeIdValue,
  type ProductFormValues
} from "@/products/creation";
import type { FinancialFamilyIdValue } from "@/products/families";
import { ProductFormRenderer } from "@/products/renderer/product-form-renderer";
import { ProductTypeSelector } from "@/products/renderer/product-type-selector";
import {
  saveCreatedChit,
  saveCreatedProduct,
  trackProductSelected,
  trackProductValidationFailed
} from "@/products/creation/save-product";
import { GoldLoanFormFields } from "@/features/loans/gold-loan-form-fields";
import { ChitFormFields } from "@/features/chits/chit-form-fields";
import {
  buildGoldLoanFromForm,
  goldLoanToFormState,
  initialGoldLoanFormState,
  isGoldLoan,
  validateGoldLoanForm
} from "@/shared/finance/gold-loan-form";
import type { GoldLoanFormState } from "@/shared/finance/gold-loan-form";
import {
  buildChitFromForm,
  chitToFormState,
  initialChitFormState,
  validateChitForm
} from "@/shared/finance/chit-form";
import type { ChitFormState } from "@/shared/finance/chit-form";
import { isActiveLoan } from "@/lib/loan-status";
import type { Chit } from "@/shared/domain/chit";
import type { Loan } from "@/shared/domain/finance";

export interface ProductFormScreenProps {
  mode: "create" | "edit";
  initialCreationTypeId?: ProductCreationTypeIdValue | null;
  familyFilter?: FinancialFamilyIdValue | string | null;
  /** @deprecated Use familyFilter */
  groupFilter?: FinancialFamilyIdValue | string | null;
  loanId?: string;
  chitId?: string;
  backHref?: string;
}

export function ProductFormScreen({
  mode,
  initialCreationTypeId = null,
  familyFilter = null,
  groupFilter = null,
  loanId,
  chitId,
  backHref = "/products"
}: ProductFormScreenProps) {
  const activeFamilyFilter = familyFilter ?? groupFilter;
  const router = useRouter();
  const [creationTypeId, setCreationTypeId] = useState<ProductCreationTypeIdValue | null>(
    initialCreationTypeId
  );
  const [form, setForm] = useState<ProductFormValues>({});
  const [goldForm, setGoldForm] = useState<GoldLoanFormState>(initialGoldLoanFormState);
  const [chitForm, setChitForm] = useState<ChitFormState>(initialChitFormState);
  const [existingLoan, setExistingLoan] = useState<Loan | null>(null);
  const [existingChit, setExistingChit] = useState<Chit | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");

  const definition = creationTypeId ? getProductCreationDefinition(creationTypeId) : null;
  const catalogEntry = creationTypeId ? getCreationCatalogEntry(creationTypeId) : null;

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const profile = await financeRepository.getProfile();
      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      if (mode === "edit" && loanId) {
        const loan = await financeRepository.getLoan(loanId);
        if (!loan || !isActiveLoan(loan)) {
          router.replace("/loans");
          return;
        }

        const resolvedType = resolveCreationTypeFromLoanType(loan.type, loan.customTypeName);
        const def = getProductCreationDefinition(resolvedType);

        if (!mounted) return;

        setExistingLoan(loan);
        setCreationTypeId(resolvedType);

        if (isGoldLoan(loan) || def?.usesDedicatedForm === "gold-loan") {
          setGoldForm(goldLoanToFormState(loan));
        } else if (def?.loanToFormValues) {
          setForm(def.loanToFormValues(loan));
        }

        setIsLoading(false);
        return;
      }

      if (mode === "edit" && chitId) {
        const chit = await financeRepository.getChit(chitId);
        if (!chit) {
          router.replace("/chits");
          return;
        }

        if (!mounted) return;
        setExistingChit(chit);
        setCreationTypeId(ProductCreationTypeId.CHIT);
        setChitForm(chitToFormState(chit));
        setIsLoading(false);
        return;
      }

      if (initialCreationTypeId) {
        const def = getProductCreationDefinition(initialCreationTypeId);
        if (def && !def.usesDedicatedForm && mounted) {
          setForm(def.getInitialFormState());
        }
      }

      setIsLoading(false);
    }

    void bootstrap();
  }, [mode, loanId, chitId, router, initialCreationTypeId]);

  const selectCreationType = useCallback((nextType: ProductCreationTypeIdValue) => {
    const entry = getCreationCatalogEntry(nextType);
    if (!entry || entry.availability === "coming-soon") {
      return;
    }

    trackProductSelected(nextType);
    setCreationTypeId(nextType);
    setErrors([]);

    const def = getProductCreationDefinition(nextType);
    if (def && !def.usesDedicatedForm) {
      setForm(def.getInitialFormState());
    }
  }, []);

  function updateField(field: string, value: string) {
    if (!definition || definition.usesDedicatedForm) {
      return;
    }

    setForm((current) => {
      const previous = current;
      const next = { ...current, [field]: value };
      return definition.onFieldChange?.(field, next, previous) ?? next;
    });
    setErrors([]);
  }

  const canSave = useMemo(() => {
    if (!creationTypeId || !definition) {
      return false;
    }

    if (definition.usesDedicatedForm === "gold-loan") {
      return (
        goldForm.name.trim().length > 0 &&
        goldForm.lender.trim().length > 0 &&
        validateGoldLoanForm(goldForm).length === 0
      );
    }

    if (definition.usesDedicatedForm === "chit") {
      return chitForm.chitName.trim().length > 0 && validateChitForm(chitForm).length === 0;
    }

    return definition.validate(form).length === 0 && Boolean(form.name?.trim());
  }, [creationTypeId, definition, form, goldForm, chitForm]);

  async function handleSave() {
    if (!creationTypeId || !definition) {
      return;
    }

    if (definition.usesDedicatedForm === "gold-loan") {
      const validationErrors = validateGoldLoanForm(goldForm);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        trackProductValidationFailed(creationTypeId);
        return;
      }

      setIsSaving(true);
      const loan = buildGoldLoanFromForm(goldForm, existingLoan ?? undefined);
      const result = await saveCreatedProduct({
        repository: financeRepository,
        creationTypeId,
        loan,
        existingLoan
      });
      router.replace(result.redirectPath);
      return;
    }

    if (definition.usesDedicatedForm === "chit") {
      const validationErrors = validateChitForm(chitForm);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        trackProductValidationFailed(creationTypeId);
        return;
      }

      setIsSaving(true);
      const chit = buildChitFromForm(chitForm, existingChit ?? undefined);
      const result = await saveCreatedChit({
        repository: financeRepository,
        chit,
        previousChit: existingChit
      });
      router.replace(result.redirectPath);
      return;
    }

    const validationErrors = definition.validate(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      trackProductValidationFailed(creationTypeId);
      return;
    }

    setIsSaving(true);
    const result = await saveCreatedProduct({
      repository: financeRepository,
      creationTypeId,
      form,
      existingLoan
    });
    router.replace(result.redirectPath);
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <p className="text-sm text-muted-foreground">Loading product form…</p>
      </div>
    );
  }

  const title =
    mode === "edit"
      ? `Edit ${catalogEntry?.label ?? "product"}`
      : creationTypeId
        ? `Add ${catalogEntry?.label ?? "product"}`
        : "Add Financial Product";

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {mode === "edit" ? "Edit product" : "New product"}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Product type drives the form. You only enter what matters for this instrument.
          </p>
        </div>
      </header>

      {mode === "create" && !creationTypeId ? (
        <section className="space-y-3">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              What are you adding?
            </span>
          </label>
          <ProductTypeSelector
            selectedTypeId={creationTypeId}
            onSelect={selectCreationType}
            familyFilter={activeFamilyFilter}
          />
        </section>
      ) : (
        <>
          {mode === "create" ? (
            <Card className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Product type
              </p>
              <p className="font-medium">{catalogEntry?.label}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCreationTypeId(null);
                  setErrors([]);
                }}
              >
                Change type
              </Button>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Product type
              </p>
              <p className="mt-1 font-medium">{catalogEntry?.label}</p>
            </Card>
          )}

          <Card>
            {definition?.usesDedicatedForm === "gold-loan" ? (
              <GoldLoanFormFields
                form={goldForm}
                errors={errors}
                onChange={(field, value) => {
                  setGoldForm((current) => ({ ...current, [field]: value }));
                  setErrors([]);
                }}
              />
            ) : null}

            {definition?.usesDedicatedForm === "chit" ? (
              <ChitFormFields
                form={chitForm}
                errors={errors}
                onChange={(field, value) => {
                  setChitForm((current) => ({ ...current, [field]: value }));
                  setErrors([]);
                }}
              />
            ) : null}

            {definition?.schema ? (
              <ProductFormRenderer
                schema={definition.schema}
                form={form}
                errors={errors}
                onChange={updateField}
              />
            ) : null}
          </Card>

          <Button
            className="w-full gap-2"
            disabled={!canSave || isSaving}
            onClick={() => void handleSave()}
          >
            {mode === "edit" ? "Save changes" : "Save product"}
            <Check className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
