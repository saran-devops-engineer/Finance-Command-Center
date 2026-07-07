"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import type { Loan, LoanType, UpcomingDue } from "@/shared/domain/finance";

interface LoanFormState {
  name: string;
  type: LoanType;
  customTypeName: string;
  lender: string;
  originalAmount: string;
  outstandingBalance: string;
  annualInterestRate: string;
  monthlyEmi: string;
  nextDueDate: string;
}

const initialState: LoanFormState = {
  name: "",
  type: "personal",
  customTypeName: "",
  lender: "",
  originalAmount: "",
  outstandingBalance: "",
  annualInterestRate: "",
  monthlyEmi: "",
  nextDueDate: ""
};

const loanTypes: Array<{ value: LoanType; label: string }> = [
  { value: "home", label: "Home Loan" },
  { value: "gold", label: "Gold Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "vehicle", label: "Vehicle Loan" },
  { value: "education", label: "Education Loan" },
  { value: "credit-card-emi", label: "Credit Card EMI" },
  { value: "consumer-emi", label: "Consumer EMI" },
  { value: "friends-family", label: "Friends / Family" },
  { value: "custom", label: "Custom" },
  { value: "other", label: "Other" }
];

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLoan(form: LoanFormState): Loan {
  const outstandingBalance = toNumber(form.outstandingBalance);
  const originalAmount = toNumber(form.originalAmount) || outstandingBalance;
  const monthlyEmi = toNumber(form.monthlyEmi);
  const principalPaid = Math.max(originalAmount - outstandingBalance, 0);

  return {
    id: `loan-${crypto.randomUUID()}`,
    name: form.name.trim(),
    type: form.type,
    customTypeName: form.type === "custom" ? form.customTypeName.trim() : undefined,
    lender: form.lender.trim() || "Manual entry",
    originalAmount,
    outstandingBalance,
    annualInterestRate: toNumber(form.annualInterestRate),
    monthlyEmi,
    principalPaid,
    interestPaid: 0,
    remainingTenureMonths: monthlyEmi > 0 ? Math.ceil(outstandingBalance / monthlyEmi) : 0,
    estimatedClosureDate: "",
    nextDueDate: form.nextDueDate || new Date().toISOString().slice(0, 10)
  };
}

function buildDue(loan: Loan): UpcomingDue {
  return {
    id: `due-${loan.id}`,
    title: `${loan.name} EMI`,
    dueDate: loan.nextDueDate,
    amount: loan.monthlyEmi,
    source: "loan"
  };
}

export function AddLoanScreen() {
  const router = useRouter();
  const [form, setForm] = useState<LoanFormState>(initialState);
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

  const canSave =
    form.name.trim().length > 0 &&
    toNumber(form.outstandingBalance) > 0 &&
    toNumber(form.monthlyEmi) > 0;

  function updateField<Key extends keyof LoanFormState>(
    field: Key,
    value: LoanFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveLoan() {
    setIsSaving(true);

    const loan = buildLoan(form);
    const moneyBreakdown = await indexedDbFinanceRepository.getMoneyBreakdown();

    await indexedDbFinanceRepository.saveLoan(loan);
    await indexedDbFinanceRepository.saveUpcomingDue(buildDue(loan));

    if (moneyBreakdown) {
      await indexedDbFinanceRepository.saveMoneyBreakdown({
        ...moneyBreakdown,
        loanPayments: moneyBreakdown.loanPayments + loan.monthlyEmi
      });
    }

    router.replace("/loans");
  }

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

      <Card className="space-y-5">
        <Field
          label="Loan name"
          value={form.name}
          onChange={(value) => updateField("name", value)}
          placeholder="Muthoot Gold Loan"
        />

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Loan type
          </span>
          <select
            value={form.type}
            onChange={(event) => updateField("type", event.target.value as LoanType)}
            className={cn("h-12 w-full border border-border bg-white/45 px-4 text-base outline-none focus:border-primary", radius.input)}
          >
            {loanTypes.map((loanType) => (
              <option key={loanType.value} value={loanType.value}>
                {loanType.label}
              </option>
            ))}
          </select>
          <span className="block text-xs leading-5 text-muted-foreground">
            Loan type helps the app prioritize high-interest and urgent commitments.
          </span>
        </label>

        {form.type === "custom" ? (
          <Field
            label="Custom type"
            value={form.customTypeName}
            onChange={(value) => updateField("customTypeName", value)}
            placeholder="Office advance"
          />
        ) : null}

        <Field
          label="Lender"
          value={form.lender}
          onChange={(value) => updateField("lender", value)}
          placeholder="Bank or person"
        />
        <Field
          label="Original amount"
          value={form.originalAmount}
          onChange={(value) => updateField("originalAmount", value)}
          placeholder="500000"
          inputMode="numeric"
        />
        <Field
          label="Outstanding balance"
          value={form.outstandingBalance}
          onChange={(value) => updateField("outstandingBalance", value)}
          placeholder="189500"
          inputMode="numeric"
        />
        <Field
          label="Interest rate"
          value={form.annualInterestRate}
          onChange={(value) => updateField("annualInterestRate", value)}
          placeholder="13.9"
          inputMode="decimal"
          helperText="Use annual rate. Higher-interest loans will be reviewed first."
        />
        <Field
          label="Monthly EMI"
          value={form.monthlyEmi}
          onChange={(value) => updateField("monthlyEmi", value)}
          placeholder="12400"
          inputMode="numeric"
        />
        <Field
          label="Next due date"
          value={form.nextDueDate}
          onChange={(value) => updateField("nextDueDate", value)}
          type="date"
        />
      </Card>

      <Button className="w-full gap-2" disabled={!canSave || isSaving} onClick={() => void saveLoan()}>
        Save loan
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
  helperText?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  helperText
}: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        className={cn("h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary", radius.input)}
      />
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}
