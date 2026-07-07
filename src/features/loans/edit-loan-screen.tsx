"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoanFormFields } from "@/features/loans/loan-form-fields";
import { spacing } from "@/lib/design-tokens";
import { isActiveLoan } from "@/lib/loan-status";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import {
  buildLoanFromForm,
  loanToFormState,
  validateLoanForm
} from "@/shared/finance/loan-form";
import { saveLoanUpdate } from "@/services/loan-management/loan-lifecycle";
import type { LoanFormState } from "@/shared/finance/loan-form";
import type { Loan } from "@/shared/domain/finance";

interface EditLoanScreenProps {
  loanId: string;
}

export function EditLoanScreen({ loanId }: EditLoanScreenProps) {
  const router = useRouter();
  const [existingLoan, setExistingLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState<LoanFormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLoan() {
      const [profile, loan] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getLoan(loanId)
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
      setForm(loanToFormState(loan));
    }

    void loadLoan();

    return () => {
      isMounted = false;
    };
  }, [loanId, router]);

  function updateField<Key extends keyof LoanFormState>(
    field: Key,
    value: LoanFormState[Key]
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors([]);
  }

  async function saveChanges() {
    if (!form || !existingLoan) {
      return;
    }

    const validationErrors = validateLoanForm(form);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    const updatedLoan = buildLoanFromForm(form, existingLoan);
    await saveLoanUpdate(indexedDbFinanceRepository, existingLoan, updatedLoan);
    router.replace(`/loans/${loanId}?saved=1`);
  }

  if (!form) {
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
            {existingLoan?.name}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Updates flow automatically to your dashboard, recommendations, and simulations.
          </p>
        </div>
      </header>

      <Card>
        <LoanFormFields form={form} errors={errors} onChange={updateField} />
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
