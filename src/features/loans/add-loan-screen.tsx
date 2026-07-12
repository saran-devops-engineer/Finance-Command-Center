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
import {
  trackLoanCreatedEvent
} from "@/core/analytics/loan-analytics-events";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { financeRepository } from "@/repositories";
import {
  applyHomeLoanAutoCalculations,
  buildHomeLoanFromForm,
  initialHomeLoanFormState,
  validateHomeLoanForm
} from "@/shared/finance/home-loan-form";
import type { HomeLoanFormState } from "@/shared/finance/home-loan-form";
import {
  buildGoldLoanFromForm,
  initialGoldLoanFormState,
  validateGoldLoanForm
} from "@/shared/finance/gold-loan-form";
import type { GoldLoanFormState } from "@/shared/finance/gold-loan-form";
import {
  buildLoanFromForm,
  validateLoanForm
} from "@/shared/finance/loan-form";
import type { LoanFormState } from "@/shared/finance/loan-form";
import { syncLoanCommitments } from "@/services/loan-management/loan-lifecycle";
import type { LoanType } from "@/shared/domain/finance";

type LoanKind = "home" | "gold" | "other";

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
  const [loanKind, setLoanKind] = useState<LoanKind>("home");
  const [homeForm, setHomeForm] = useState<HomeLoanFormState>(initialHomeLoanFormState);
  const [goldForm, setGoldForm] = useState<GoldLoanFormState>(initialGoldLoanFormState);
  const [otherForm, setOtherForm] = useState<LoanFormState>(initialOtherLoanState);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyOnboarding() {
      const profile = await financeRepository.getProfile();

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

  function updateGoldField<Key extends keyof GoldLoanFormState>(
    field: Key,
    value: GoldLoanFormState[Key]
  ) {
    setGoldForm((current) => ({ ...current, [field]: value }));
    setErrors([]);
  }

  function updateOtherField<Key extends keyof LoanFormState>(
    field: Key,
    value: LoanFormState[Key]
  ) {
    setOtherForm((current) => ({ ...current, [field]: value }));
    setErrors([]);
  }

  function switchLoanKind(kind: LoanKind) {
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
      await financeRepository.saveLoan(loan);
      await syncLoanCommitments(financeRepository, null, loan);
      notifyFinanceDataUpdated("loan");
      trackLoanCreatedEvent(loan);
      router.replace("/loans");
      return;
    }

    if (loanKind === "gold") {
      const validationErrors = validateGoldLoanForm(goldForm);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSaving(true);
      const loan = buildGoldLoanFromForm(goldForm);
      await financeRepository.saveLoan(loan);
      await syncLoanCommitments(financeRepository, null, loan);
      notifyFinanceDataUpdated("loan");
      trackLoanCreatedEvent(loan);
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
    await financeRepository.saveLoan(loan);
    await syncLoanCommitments(financeRepository, null, loan);
    notifyFinanceDataUpdated("loan");
    router.replace("/loans");
  }

  const canSaveHome =
    homeForm.name.trim().length > 0 &&
    homeForm.lender.trim().length > 0 &&
    validateHomeLoanForm(homeForm).length === 0;

  const canSaveGold =
    goldForm.name.trim().length > 0 &&
    goldForm.lender.trim().length > 0 &&
    validateGoldLoanForm(goldForm).length === 0;

  const canSaveOther =
    otherForm.name.trim().length > 0 && validateLoanForm(otherForm).length === 0;

  const canSave =
    loanKind === "home" ? canSaveHome : loanKind === "gold" ? canSaveGold : canSaveOther;

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
          onChange={(event) => switchLoanKind(event.target.value as LoanKind)}
          className="h-12 w-full rounded-xl border border-border bg-white/45 px-4 text-base outline-none focus:border-primary"
        >
          <option value="home">Home Loan</option>
          <option value="gold">Gold Loan</option>
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
        ) : loanKind === "gold" ? (
          <GoldLoanFormFields form={goldForm} errors={errors} onChange={updateGoldField} />
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
