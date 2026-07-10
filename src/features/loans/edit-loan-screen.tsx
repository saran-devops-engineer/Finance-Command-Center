"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoldLoanFormFields } from "@/features/loans/gold-loan-form-fields";
import { HomeLoanFormFields } from "@/features/loans/home-loan-form-fields";
import { LoanFormFields } from "@/features/loans/loan-form-fields";
import { spacing } from "@/lib/design-tokens";
import { isActiveLoan } from "@/lib/loan-status";
import { financeRepository } from "@/repositories";
import {
  applyHomeLoanAutoCalculations,
  buildHomeLoanFromForm,
  homeLoanToFormState,
  isHomeLoan,
  validateHomeLoanForm
} from "@/shared/finance/home-loan-form";
import type { HomeLoanFormState } from "@/shared/finance/home-loan-form";
import {
  buildGoldLoanFromForm,
  goldLoanToFormState,
  isGoldLoan,
  validateGoldLoanForm
} from "@/shared/finance/gold-loan-form";
import type { GoldLoanFormState } from "@/shared/finance/gold-loan-form";
import {
  buildLoanFromForm,
  loanToFormState,
  validateLoanForm
} from "@/shared/finance/loan-form";
import type { LoanFormState } from "@/shared/finance/loan-form";
import { saveLoanUpdate } from "@/services/loan-management/loan-lifecycle";
import type { Loan } from "@/shared/domain/finance";

interface EditLoanScreenProps {
  loanId: string;
}

export function EditLoanScreen({ loanId }: EditLoanScreenProps) {
  const router = useRouter();
  const [existingLoan, setExistingLoan] = useState<Loan | null>(null);
  const [homeForm, setHomeForm] = useState<HomeLoanFormState | null>(null);
  const [goldForm, setGoldForm] = useState<GoldLoanFormState | null>(null);
  const [otherForm, setOtherForm] = useState<LoanFormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLoan() {
      const [profile, loan] = await Promise.all([
        financeRepository.getProfile(),
        financeRepository.getLoan(loanId)
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      if (!loan || !isActiveLoan(loan)) {
        router.replace("/loans");
        return;
      }

      setExistingLoan(loan);

      if (isHomeLoan(loan)) {
        setHomeForm(homeLoanToFormState(loan));
      } else if (isGoldLoan(loan)) {
        setGoldForm(goldLoanToFormState(loan));
      } else {
        setOtherForm(loanToFormState(loan));
      }
    }

    void loadLoan();

    return () => {
      isMounted = false;
    };
  }, [loanId, router]);

  function updateHomeField<Key extends keyof HomeLoanFormState>(
    field: Key,
    value: HomeLoanFormState[Key]
  ) {
    setHomeForm((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, [field]: value };
      return applyHomeLoanAutoCalculations(next, current);
    });
    setErrors([]);
  }

  function updateGoldField<Key extends keyof GoldLoanFormState>(
    field: Key,
    value: GoldLoanFormState[Key]
  ) {
    setGoldForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors([]);
  }

  function updateOtherField<Key extends keyof LoanFormState>(
    field: Key,
    value: LoanFormState[Key]
  ) {
    setOtherForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors([]);
  }

  async function saveChanges() {
    if (!existingLoan) {
      return;
    }

    if (isHomeLoan(existingLoan) && homeForm) {
      const validationErrors = validateHomeLoanForm(homeForm);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSaving(true);
      const updatedLoan = buildHomeLoanFromForm(homeForm, existingLoan);
      await saveLoanUpdate(financeRepository, existingLoan, updatedLoan);
      router.replace(`/loans/${loanId}?saved=1`);
      return;
    }

    if (isGoldLoan(existingLoan) && goldForm) {
      const validationErrors = validateGoldLoanForm(goldForm);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSaving(true);
      const updatedLoan = buildGoldLoanFromForm(goldForm, existingLoan);
      await saveLoanUpdate(financeRepository, existingLoan, updatedLoan);
      router.replace(`/loans/${loanId}?saved=1`);
      return;
    }

    if (!otherForm) {
      return;
    }

    const validationErrors = validateLoanForm(otherForm);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const updatedLoan = buildLoanFromForm(otherForm, existingLoan);
    await saveLoanUpdate(financeRepository, existingLoan, updatedLoan);
    router.replace(`/loans/${loanId}?saved=1`);
  }

  if (!existingLoan || (!homeForm && !goldForm && !otherForm)) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading loan details.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href={`/loans/${loanId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Loan details
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Edit loan
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {existingLoan.name}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Updates flow automatically to your dashboard, recommendations, and simulations.
          </p>
        </div>
      </header>

      <Card>
        {homeForm ? (
          <HomeLoanFormFields form={homeForm} errors={errors} onChange={updateHomeField} />
        ) : goldForm ? (
          <GoldLoanFormFields form={goldForm} errors={errors} onChange={updateGoldField} />
        ) : (
          <LoanFormFields form={otherForm!} errors={errors} onChange={updateOtherField} />
        )}
      </Card>

      <Button
        className="w-full gap-2"
        disabled={isSaving}
        onClick={() => void saveChanges()}
      >
        Save changes
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
