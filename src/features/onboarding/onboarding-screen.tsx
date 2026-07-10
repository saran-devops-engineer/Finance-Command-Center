"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import type { Loan, MoneyBreakdown, UpcomingDue, UserProfile } from "@/shared/domain/finance";

interface OnboardingFormState {
  displayName: string;
  monthlyIncome: string;
  fixedExpenses: string;
  emis: string;
  insurance: string;
  utilityBills: string;
  emergencyBuffer: string;
  loanName: string;
  lender: string;
  outstandingBalance: string;
  originalAmount: string;
  interestRate: string;
  monthlyEmi: string;
  nextDueDate: string;
}

const initialState: OnboardingFormState = {
  displayName: "",
  monthlyIncome: "",
  fixedExpenses: "",
  emis: "",
  insurance: "",
  utilityBills: "",
  emergencyBuffer: "",
  loanName: "",
  lender: "",
  outstandingBalance: "",
  originalAmount: "",
  interestRate: "",
  monthlyEmi: "",
  nextDueDate: ""
};

const steps = [
  {
    eyebrow: "Step 1",
    title: "Monthly cash flow",
    description: "Start with the numbers that decide whether this month is safe."
  },
  {
    eyebrow: "Step 2",
    title: "Main loan",
    description: "Add one important loan now. You can add more later."
  },
  {
    eyebrow: "Step 3",
    title: "Ready",
    description: "Your command center will use this to create the first local snapshot."
  }
] as const;

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDisplayName(value: string) {
  const displayName = value.trim();

  if (!displayName) {
    return "Arjun";
  }

  if (displayName.toLowerCase() === "arjun") {
    return "Arjun";
  }

  return displayName;
}

function buildLoan(form: OnboardingFormState): Loan | null {
  const outstandingBalance = toNumber(form.outstandingBalance);
  const originalAmount = toNumber(form.originalAmount) || outstandingBalance;
  const monthlyEmi = toNumber(form.monthlyEmi);

  if (!form.loanName.trim() || outstandingBalance <= 0 || monthlyEmi <= 0) {
    return null;
  }

  const principalPaid = Math.max(originalAmount - outstandingBalance, 0);

  return {
    id: `loan-${crypto.randomUUID()}`,
    name: form.loanName.trim(),
    type: "personal",
    lender: form.lender.trim() || "Manual entry",
    originalAmount,
    outstandingBalance,
    annualInterestRate: toNumber(form.interestRate),
    monthlyEmi,
    principalPaid,
    interestPaid: 0,
    remainingTenureMonths: monthlyEmi > 0 ? Math.ceil(outstandingBalance / monthlyEmi) : 0,
    estimatedClosureDate: "",
    nextDueDate: form.nextDueDate || new Date().toISOString().slice(0, 10),
    status: "active"
  };
}

function buildDue(loan: Loan | null): UpcomingDue | null {
  if (!loan) {
    return null;
  }

  return {
    id: `due-${loan.id}`,
    title: `${loan.name} EMI`,
    dueDate: loan.nextDueDate,
    amount: loan.monthlyEmi,
    source: "loan"
  };
}

export function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = steps[step];
  const canContinue = useMemo(() => {
    if (step === 0) {
      return toNumber(form.monthlyIncome) > 0;
    }

    if (step === 1) {
      return true;
    }

    return true;
  }, [form.monthlyIncome, step]);

  function updateField(field: keyof OnboardingFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function finishOnboarding() {
    setIsSaving(true);

    const loan = buildLoan(form);
    const due = buildDue(loan);
    const now = new Date().toISOString();

    const moneyBreakdown: MoneyBreakdown = {
      monthlyIncome: toNumber(form.monthlyIncome),
      mandatoryExpenses: toNumber(form.fixedExpenses),
      emis: toNumber(form.emis),
      loanPayments: loan?.monthlyEmi ?? 0,
      insurance: toNumber(form.insurance),
      rent: 0,
      utilityBills: toNumber(form.utilityBills),
      fixedCommitments: 0,
      emergencyBuffer: toNumber(form.emergencyBuffer)
    };

    const profile: UserProfile = {
      id: "primary",
      displayName: normalizeDisplayName(form.displayName),
      currency: "INR",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now
    };

    await financeRepository.saveProfile(profile);
    await financeRepository.saveMoneyBreakdown(moneyBreakdown);

    if (loan) {
      await financeRepository.saveLoan(loan);
    }

    if (due) {
      await financeRepository.saveUpcomingDue(due);
    }

    router.replace("/");
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {currentStep.eyebrow}
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          {currentStep.title}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {currentStep.description}
        </p>
      </header>

      <Card className="space-y-5">
        {step === 0 ? (
          <>
            <Field
              label="Name"
              value={form.displayName}
              onChange={(value) => updateField("displayName", value)}
              placeholder="Arjun"
            />
            <Field
              label="Monthly income"
              value={form.monthlyIncome}
              onChange={(value) => updateField("monthlyIncome", value)}
              placeholder="285000"
              inputMode="numeric"
            />
            <Field
              label="Fixed expenses"
              value={form.fixedExpenses}
              onChange={(value) => updateField("fixedExpenses", value)}
              placeholder="42000"
              inputMode="numeric"
            />
            <Field
              label="Other EMIs"
              value={form.emis}
              onChange={(value) => updateField("emis", value)}
              placeholder="18600"
              inputMode="numeric"
            />
            <Field
              label="Insurance"
              value={form.insurance}
              onChange={(value) => updateField("insurance", value)}
              placeholder="12800"
              inputMode="numeric"
            />
            <Field
              label="Utility bills"
              value={form.utilityBills}
              onChange={(value) => updateField("utilityBills", value)}
              placeholder="6400"
              inputMode="numeric"
            />
            <Field
              label="Emergency buffer"
              value={form.emergencyBuffer}
              onChange={(value) => updateField("emergencyBuffer", value)}
              placeholder="240000"
              inputMode="numeric"
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field
              label="Loan name"
              value={form.loanName}
              onChange={(value) => updateField("loanName", value)}
              placeholder="HDFC Home Loan"
            />
            <Field
              label="Lender"
              value={form.lender}
              onChange={(value) => updateField("lender", value)}
              placeholder="HDFC Bank"
            />
            <Field
              label="Original amount"
              value={form.originalAmount}
              onChange={(value) => updateField("originalAmount", value)}
              placeholder="4200000"
              inputMode="numeric"
            />
            <Field
              label="Outstanding balance"
              value={form.outstandingBalance}
              onChange={(value) => updateField("outstandingBalance", value)}
              placeholder="3820000"
              inputMode="numeric"
            />
            <Field
              label="Interest rate"
              value={form.interestRate}
              onChange={(value) => updateField("interestRate", value)}
              placeholder="8.6"
              inputMode="decimal"
            />
            <Field
              label="Monthly EMI"
              value={form.monthlyEmi}
              onChange={(value) => updateField("monthlyEmi", value)}
              placeholder="45200"
              inputMode="numeric"
            />
            <Field
              label="Next due date"
              value={form.nextDueDate}
              onChange={(value) => updateField("nextDueDate", value)}
              type="date"
            />
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12" strokeWidth={1.5} />
            <div>
              <h2 className="font-display text-3xl tracking-[-0.04em]">
                Your first snapshot is ready.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Your data will stay on this device. The dashboard will now show
                available money, health status, dues, and recommendations.
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex gap-3">
        {step > 0 ? (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setStep((current) => current - 1)}
          >
            Back
          </Button>
        ) : null}
        <Button
          className="flex-1 gap-2"
          disabled={!canContinue || isSaving}
          onClick={() => {
            if (step < steps.length - 1) {
              setStep((current) => current + 1);
              return;
            }

            void finishOnboarding();
          }}
        >
          {step === steps.length - 1 ? "Open dashboard" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
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
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text"
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
    </label>
  );
}
