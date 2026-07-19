"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppEvent, identifyAnalyticsUser, trackApplicationEvent } from "@/core/analytics";
import { radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { financeRepository, getApplicationServices } from "@/repositories";
import {
  buildOnboardingData,
  toOnboardingNumber
} from "@/services/onboarding/build-onboarding-data";
import { syncProductGeneratedCommitments } from "@/services/commitment-sync/sync-product-commitments";

interface OnboardingFormState {
  displayName: string;
  monthlyIncome: string;
  emergencyBuffer: string;
  loanName: string;
  lender: string;
  outstandingBalance: string;
  originalAmount: string;
  interestRate: string;
  monthlyEmi: string;
  nextDueDate: string;
  rent: string;
  electricity: string;
  internet: string;
  groceries: string;
  subscriptions: string;
  utilities: string;
}

const initialState: OnboardingFormState = {
  displayName: "",
  monthlyIncome: "",
  emergencyBuffer: "",
  loanName: "",
  lender: "",
  outstandingBalance: "",
  originalAmount: "",
  interestRate: "",
  monthlyEmi: "",
  nextDueDate: "",
  rent: "",
  electricity: "",
  internet: "",
  groceries: "",
  subscriptions: "",
  utilities: ""
};

const steps = [
  {
    eyebrow: "Step 1",
    title: "Your profile",
    description: "Name, monthly income, and your emergency buffer goal. Simple mode only."
  },
  {
    eyebrow: "Step 2",
    title: "Add a product",
    description: "Create one loan now, or skip and add products later from Products."
  },
  {
    eyebrow: "Step 3",
    title: "Manual commitments",
    description:
      "Recurring obligations that are not loans or chits — rent, utilities, and similar."
  }
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    trackApplicationEvent(AppEvent.ONBOARDING_STARTED);
  }, []);

  const currentStep = steps[step];
  const canContinue = useMemo(() => {
    if (step === 0) {
      return toOnboardingNumber(form.monthlyIncome) > 0;
    }

    return true;
  }, [form.monthlyIncome, step]);

  function updateField(field: keyof OnboardingFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function finishOnboarding() {
    setIsSaving(true);

    try {
      const built = buildOnboardingData({
        profile: {
          displayName: form.displayName,
          monthlyIncome: toOnboardingNumber(form.monthlyIncome),
          emergencyBuffer: toOnboardingNumber(form.emergencyBuffer)
        },
        loan: {
          loanName: form.loanName,
          lender: form.lender,
          originalAmount: toOnboardingNumber(form.originalAmount),
          outstandingBalance: toOnboardingNumber(form.outstandingBalance),
          interestRate: toOnboardingNumber(form.interestRate),
          monthlyEmi: toOnboardingNumber(form.monthlyEmi),
          nextDueDate: form.nextDueDate
        },
        commitments: {
          rent: toOnboardingNumber(form.rent),
          electricity: toOnboardingNumber(form.electricity),
          internet: toOnboardingNumber(form.internet),
          groceries: toOnboardingNumber(form.groceries),
          subscriptions: toOnboardingNumber(form.subscriptions),
          utilities: toOnboardingNumber(form.utilities)
        }
      });

      await financeRepository.saveProfile(built.profile);
      await financeRepository.saveIncomeProfile(built.incomeProfile);
      await financeRepository.saveMoneyBreakdown(built.moneyBreakdown);

      for (const commitment of built.commitments) {
        await financeRepository.saveCommitment(commitment);
        trackApplicationEvent(AppEvent.COMMITMENT_CREATED, {
          commitment_id: commitment.id
        });
      }

      if (built.incomeProfile.sources[0]) {
        trackApplicationEvent(AppEvent.INCOME_SOURCE_ADDED, {
          income_source_id: built.incomeProfile.sources[0].id
        });
      }

      if (built.loan) {
        await financeRepository.saveLoan(built.loan);
        trackApplicationEvent(AppEvent.PRODUCT_CREATED, {
          product_type: built.loan.type,
          product_id: built.loan.id
        });
      }

      if (built.due) {
        await financeRepository.saveUpcomingDue(built.due);
      }

      // Ensure schema meta reflects V2 after first-run onboarding.
      await financeRepository.migrateDataSchema();
      await syncProductGeneratedCommitments(financeRepository);

      identifyAnalyticsUser(getApplicationServices().analytics, built.profile.displayName);
      trackApplicationEvent(AppEvent.PROFILE_CREATED);
      trackApplicationEvent(AppEvent.ONBOARDING_COMPLETED);

      router.replace("/");
    } finally {
      setIsSaving(false);
    }
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
        <p className="text-sm leading-6 text-muted-foreground">{currentStep.description}</p>
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
              label="Emergency buffer goal"
              value={form.emergencyBuffer}
              onChange={(value) => updateField("emergencyBuffer", value)}
              placeholder="240000"
              inputMode="numeric"
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Loan EMIs are tracked through products — do not enter them as separate cash-flow
              lines.
            </p>
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
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Add only recurring obligations that are not already represented by a loan or chit.
            </p>
            <Field
              label="Rent"
              value={form.rent}
              onChange={(value) => updateField("rent", value)}
              placeholder="18000"
              inputMode="numeric"
            />
            <Field
              label="Electricity"
              value={form.electricity}
              onChange={(value) => updateField("electricity", value)}
              placeholder="2500"
              inputMode="numeric"
            />
            <Field
              label="Internet"
              value={form.internet}
              onChange={(value) => updateField("internet", value)}
              placeholder="999"
              inputMode="numeric"
            />
            <Field
              label="Groceries"
              value={form.groceries}
              onChange={(value) => updateField("groceries", value)}
              placeholder="8000"
              inputMode="numeric"
            />
            <Field
              label="Subscriptions"
              value={form.subscriptions}
              onChange={(value) => updateField("subscriptions", value)}
              placeholder="500"
              inputMode="numeric"
            />
            <Field
              label="Utilities"
              value={form.utilities}
              onChange={(value) => updateField("utilities", value)}
              placeholder="1500"
              inputMode="numeric"
            />
            <div className="space-y-3 border-t border-border/70 pt-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10" strokeWidth={1.5} />
              <p className="text-sm leading-6 text-muted-foreground">
                Your data stays on this device. Open the dashboard when you are ready.
              </p>
            </div>
          </>
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

        {step === 1 ? (
          <Button
            variant="secondary"
            className="flex-1"
            disabled={isSaving}
            onClick={() => setStep(2)}
          >
            Skip for now
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
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
          radius.input
        )}
      />
    </label>
  );
}
