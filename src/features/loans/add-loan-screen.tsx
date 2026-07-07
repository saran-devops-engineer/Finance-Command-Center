"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HomeLoanFormFields } from "@/features/loans/home-loan-form-fields";
import { LoanFormFields } from "@/features/loans/loan-form-fields";
import { spacing } from "@/lib/design-tokens";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import {
  applyHomeLoanAutoCalculations,
  buildHomeLoanFromForm,
  initialHomeLoanFormState,
  validateHomeLoanForm
} from "@/shared/finance/home-loan-form";
import type { HomeLoanFormState } from "@/shared/finance/home-loan-form";
import {
  buildLoanFromForm,
  validateLoanForm
} from "@/shared/finance/loan-form";
import type { LoanFormState } from "@/shared/finance/loan-form";
import { syncLoanCommitments } from "@/services/loan-management/loan-lifecycle";
import type { LoanType } from "@/shared/domain/finance";

const initialOtherLoanState: LoanFormState = {
  name: "",
  type: "personal",
  customTypeName: "",
  lender: "",
  originalAmount: "",
  outstandingBalance: "",
  annualInterestRate: "",
  monthlyEmi: "",
  remainingTenureMonths: "",
  nextDueDate: "",
  notes: ""
};

export function AddLoanScreen() {
  const router = useRouter();
  const [loanKind, setLoanKind] = useState<"home" | "other">("home");
  const [homeForm, setHomeForm] = useState<HomeLoanFormState>(initialHomeLoanFormState);
  const [otherForm, setOtherForm] = useState<LoanFormState>(initialOtherLoanState);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyOnboarding() {
      const profile = await indexedDbFinanceRepository.getProfile();

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
      }
    }

    void verifyOnboarding();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateHomeField<Key extends keyof HomeLoanFormState>(
    field: Key,
    value: HomeLoanFormState[Key]
  ) {
    setHomeForm((current) => {
      const next = { ...current, [field]: value };
      return applyHomeLoanAutoCalculations(next, current);
    });
    setErrors([]);
  }

  function updateOtherField<Key extends keyof LoanFormState>(
    field: Key,
    value: LoanFormState[Key]
  ) {
    setOtherForm((current) => ({ ...current, [field]: value }));
    setErrors([]);
  }

  function switchLoanKind(kind: "home" | "other") {
    setLoanKind(kind);
    setErrors([]);
  }

  async function saveLoan() {
    if (loanKind === "home") {
      const validationErrors = validateHomeLoanForm(homeForm);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSaving(true);
      const loan = buildHomeLoanFromForm(homeForm);
      await indexedDbFinanceRepository.saveLoan(loan);
      await syncLoanCommitments(indexedDbFinanceRepository, null, loan);
      notifyFinanceDataUpdated("loan");
      router.replace("/loans");
      return;
    }

    const validationErrors = validateLoanForm(otherForm);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const loan = buildLoanFromForm(otherForm);
    await indexedDbFinanceRepository.saveLoan(loan);
    await syncLoanCommitments(indexedDbFinanceRepository, null, loan);
    notifyFinanceDataUpdated("loan");
    router.replace("/loans");
  }

  const canSaveHome =
    homeForm.name.trim().length > 0 &&
    homeForm.lender.trim().length > 0 &&
    validateHomeLoanForm(homeForm).length === 0;

  const canSaveOther =
    otherForm.name.trim().length > 0 && validateLoanForm(otherForm).length === 0;

  const canSave = loanKind === "home" ? canSaveHome : canSaveOther;

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Loans
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            New liability
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Add a loan
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Capture only what is needed to update your monthly decision snapshot.
          </p>
        </div>
      </header>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Product
        </span>
        <select
          value={loanKind}
          onChange={(event) =>
            switchLoanKind(event.target.value === "home" ? "home" : "other")
          }
          className="h-12 w-full rounded-xl border border-border bg-white/45 px-4 text-base outline-none focus:border-primary"
        >
          <option value="home">Home Loan</option>
          <option value="other">Other loan type</option>
        </select>
      </label>

      <Card>
        {loanKind === "home" ? (
          <HomeLoanFormFields
            form={homeForm}
            errors={errors}
            onChange={updateHomeField}
          />
        ) : (
          <LoanFormFields
            form={{ ...otherForm, type: otherForm.type as LoanType }}
            errors={errors}
            onChange={updateOtherField}
          />
        )}
      </Card>

      <Button className="w-full gap-2" disabled={!canSave || isSaving} onClick={() => void saveLoan()}>
        Save loan
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
