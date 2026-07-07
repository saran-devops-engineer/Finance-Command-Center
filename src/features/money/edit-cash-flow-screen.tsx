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
import type { MoneyBreakdown } from "@/shared/domain/finance";

interface CashFlowFormState {
  monthlyIncome: string;
  mandatoryExpenses: string;
  emis: string;
  loanPayments: string;
  insurance: string;
  rent: string;
  utilityBills: string;
  fixedCommitments: string;
  emergencyBuffer: string;
}

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toFormState(value: MoneyBreakdown): CashFlowFormState {
  return {
    monthlyIncome: String(value.monthlyIncome),
    mandatoryExpenses: String(value.mandatoryExpenses),
    emis: String(value.emis),
    loanPayments: String(value.loanPayments),
    insurance: String(value.insurance),
    rent: String(value.rent),
    utilityBills: String(value.utilityBills),
    fixedCommitments: String(value.fixedCommitments),
    emergencyBuffer: String(value.emergencyBuffer)
  };
}

function toMoneyBreakdown(form: CashFlowFormState): MoneyBreakdown {
  return {
    monthlyIncome: toNumber(form.monthlyIncome),
    mandatoryExpenses: toNumber(form.mandatoryExpenses),
    emis: toNumber(form.emis),
    loanPayments: toNumber(form.loanPayments),
    insurance: toNumber(form.insurance),
    rent: toNumber(form.rent),
    utilityBills: toNumber(form.utilityBills),
    fixedCommitments: toNumber(form.fixedCommitments),
    emergencyBuffer: toNumber(form.emergencyBuffer)
  };
}

export function EditCashFlowScreen() {
  const router = useRouter();
  const [form, setForm] = useState<CashFlowFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMoneyBreakdown() {
      const [profile, moneyBreakdown] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown()
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted || !moneyBreakdown) {
        router.replace("/onboarding");
        return;
      }

      setForm(toFormState(moneyBreakdown));
    }

    void loadMoneyBreakdown();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateField(field: keyof CashFlowFormState, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function saveCashFlow() {
    if (!form) {
      return;
    }

    setIsSaving(true);
    await indexedDbFinanceRepository.saveMoneyBreakdown(toMoneyBreakdown(form));
    router.replace("/");
  }

  if (!form) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading cash flow.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href="/money"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Money
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Monthly plan
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Edit cash flow
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            These values drive available money, health status, and recommendations.
          </p>
        </div>
      </header>

      <Card className="space-y-5">
        <SectionLabel
          title="Income"
          description="Money expected this month before commitments."
        />
        <Field
          label="Monthly income"
          value={form.monthlyIncome}
          onChange={(value) => updateField("monthlyIncome", value)}
          helperText="Use reliable monthly income, not one-time windfalls."
        />

        <SectionLabel
          title="Debt commitments"
          description="Payments that should be protected before flexible spending."
        />
        <Field
          label="Loan payments"
          value={form.loanPayments}
          onChange={(value) => updateField("loanPayments", value)}
          helperText="Monthly loan EMIs already known to the app."
        />
        <Field
          label="Other EMIs"
          value={form.emis}
          onChange={(value) => updateField("emis", value)}
        />

        <SectionLabel
          title="Living commitments"
          description="Recurring expenses that keep the month running."
        />
        <Field
          label="Mandatory expenses"
          value={form.mandatoryExpenses}
          onChange={(value) => updateField("mandatoryExpenses", value)}
        />
        <Field
          label="Rent"
          value={form.rent}
          onChange={(value) => updateField("rent", value)}
        />
        <Field
          label="Utility bills"
          value={form.utilityBills}
          onChange={(value) => updateField("utilityBills", value)}
        />

        <SectionLabel
          title="Protection and buffer"
          description="Insurance, fixed obligations, and emergency money."
        />
        <Field
          label="Insurance"
          value={form.insurance}
          onChange={(value) => updateField("insurance", value)}
        />
        <Field
          label="Fixed commitments"
          value={form.fixedCommitments}
          onChange={(value) => updateField("fixedCommitments", value)}
        />
        <Field
          label="Emergency buffer"
          value={form.emergencyBuffer}
          onChange={(value) => updateField("emergencyBuffer", value)}
          helperText="This is existing reserve money, not monthly income."
        />
      </Card>

      <Button className="w-full gap-2" disabled={isSaving} onClick={() => void saveCashFlow()}>
        Save cash flow
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

function Field({ label, value, onChange, helperText }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        className={cn("h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary", radius.input)}
      />
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}

function SectionLabel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 border-t border-border/70 pt-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
