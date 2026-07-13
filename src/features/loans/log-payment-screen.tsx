"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { clarityMaskProps } from "@/lib/privacy/clarity-mask";
import { formatInr, cn } from "@/lib/utils";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { financeRepository } from "@/repositories";
import { applyLoanPayment } from "@/services/loan-payment/apply-payment";
import type { Loan, LoanPaymentKind } from "@/shared/domain/finance";

interface LogPaymentScreenProps {
  loanId: string;
}

interface PaymentFormState {
  kind: LoanPaymentKind;
  amount: string;
  interestAmount: string;
  paidOn: string;
  note: string;
}

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function LogPaymentScreen({ loanId }: LogPaymentScreenProps) {
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<PaymentFormState>({
    kind: "emi",
    amount: "",
    interestAmount: "",
    paidOn: new Date().toISOString().slice(0, 10),
    note: ""
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLoan() {
      const [profile, localLoan] = await Promise.all([
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

      if (localLoan) {
        setLoan(localLoan);
        setForm((current) => ({
          ...current,
          amount: String(localLoan.monthlyEmi || ""),
          interestAmount: String(estimateCurrentMonthInterest(localLoan))
        }));
      }

      setIsLoading(false);
    }

    void loadLoan();

    return () => {
      isMounted = false;
    };
  }, [loanId, router]);

  const principalAmount = useMemo(() => {
    const rawPrincipal = Math.max(toNumber(form.amount) - toNumber(form.interestAmount), 0);
    return loan ? Math.min(rawPrincipal, loan.outstandingBalance) : rawPrincipal;
  }, [form.amount, form.interestAmount, loan]);

  const canSave = Boolean(loan) && toNumber(form.amount) > 0 && principalAmount >= 0 && !isSaving;

  function updateField<Key extends keyof PaymentFormState>(
    field: Key,
    value: PaymentFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeKind(kind: LoanPaymentKind) {
    setForm((current) => {
      if (!loan) {
        return { ...current, kind };
      }

      const defaultInterest = kind === "prepayment" ? 0 : estimateCurrentMonthInterest(loan);
      const defaultAmount = kind === "prepayment" ? 50000 : loan.monthlyEmi;

      return {
        ...current,
        kind,
        amount: String(defaultAmount),
        interestAmount: String(defaultInterest)
      };
    });
  }

  async function savePayment() {
    if (!loan) {
      return;
    }

    setIsSaving(true);

    const result = applyLoanPayment({
      loan,
      kind: form.kind,
      amount: toNumber(form.amount),
      principalAmount,
      interestAmount: toNumber(form.interestAmount),
      paidOn: form.paidOn,
      note: form.note
    });

    await financeRepository.saveLoan(result.updatedLoan);
    await financeRepository.saveLoanPayment(result.payment);

    if (form.kind === "emi") {
      await financeRepository.deleteUpcomingDue(`due-${loan.id}`);
    }

    notifyFinanceDataUpdated("payment");
    router.replace(`/loans/${loan.id}`);
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Preparing payment.
          </h1>
        </header>
      </div>
    );
  }

  if (!loan) {
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
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Loan not found.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href={`/loans/${loan.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {loan.name}
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Record payment
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Log payment
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Update the loan balance and keep your local repayment history accurate.
          </p>
        </div>
      </header>

      <Card className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(["emi", "prepayment", "part-payment"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => changeKind(kind)}
              className={cn(
                "border px-3 py-3 text-xs font-medium capitalize transition",
                radius.input,
                form.kind === kind
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white/45"
              )}
            >
              {kind.replace("-", " ")}
            </button>
          ))}
        </div>

        <Field
          label="Amount paid"
          value={form.amount}
          onChange={(value) => updateField("amount", value)}
        />
        <Field
          label="Interest portion"
          value={form.interestAmount}
          onChange={(value) => updateField("interestAmount", value)}
        />

        <MetricCard label="Principal" value={formatInr(principalAmount)} />

        <Field
          label="Paid on"
          value={form.paidOn}
          onChange={(value) => updateField("paidOn", value)}
          type="date"
        />
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Note
          </span>
          <textarea
            {...clarityMaskProps}
            value={form.note}
            onChange={(event) => updateField("note", event.target.value)}
            placeholder="Optional"
            className={cn("min-h-24 w-full border border-border bg-white/45 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary", radius.input)}
          />
        </label>
      </Card>

      <Button className="w-full gap-2" disabled={!canSave} onClick={() => void savePayment()}>
        Save payment
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

function estimateCurrentMonthInterest(loan: Loan) {
  return Math.round(loan.outstandingBalance * (loan.annualInterestRate / 12 / 100));
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}

function Field({ label, value, onChange, type = "text" }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={type === "date" ? undefined : "numeric"}
        type={type}
        className={cn("h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary", radius.input)}
      />
    </label>
  );
}
