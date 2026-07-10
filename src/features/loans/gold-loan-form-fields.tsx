"use client";

import type { ReactNode } from "react";
import { radius } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import { computeMonthlyInterestBurden } from "@/shared/finance/gold-loan-calculations";
import type { GoldLoanFormState } from "@/shared/finance/gold-loan-form";
import { toNumber } from "@/shared/finance/loan-form";

interface GoldLoanFormFieldsProps {
  form: GoldLoanFormState;
  errors: string[];
  onChange: <Key extends keyof GoldLoanFormState>(
    field: Key,
    value: GoldLoanFormState[Key]
  ) => void;
}

export function GoldLoanFormFields({ form, errors, onChange }: GoldLoanFormFieldsProps) {
  const monthlyInterestBurden = computeMonthlyInterestBurden(
    toNumber(form.outstandingBalance),
    toNumber(form.annualInterestRate)
  );

  return (
    <div className="space-y-8">
      {errors.length > 0 ? (
        <div
          role="alert"
          className={cn("space-y-1 bg-white/45 px-4 py-3 text-sm text-destructive", radius.inner)}
        >
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <FormSection title="Loan basics">
        <Field
          label="Loan name"
          value={form.name}
          onChange={(value) => onChange("name", value)}
          placeholder="Gold Loan"
        />
        <Field label="Loan type" value="Gold Loan" readOnly />
        <Field
          label="Lender name"
          value={form.lender}
          onChange={(value) => onChange("lender", value)}
          placeholder="Muthoot Finance"
        />
      </FormSection>

      <FormSection title="Loan details">
        <Field
          label="Loan amount"
          value={form.originalAmount}
          onChange={(value) => onChange("originalAmount", value)}
          inputMode="numeric"
        />
        <Field
          label="Outstanding principal"
          value={form.outstandingBalance}
          onChange={(value) => onChange("outstandingBalance", value)}
          inputMode="numeric"
        />
        <Field
          label="Interest rate"
          value={form.annualInterestRate}
          onChange={(value) => onChange("annualInterestRate", value)}
          inputMode="decimal"
          helperText="Annual rate in percent."
        />
        <Field
          label="Loan start date"
          value={form.loanStartDate}
          onChange={(value) => onChange("loanStartDate", value)}
          type="date"
        />
        <Field
          label="Renewal date"
          value={form.renewalDate}
          onChange={(value) => onChange("renewalDate", value)}
          type="date"
          helperText="When the gold loan must be renewed or repaid."
        />
      </FormSection>

      <FormSection title="Interest payment">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Interest payment type
          </span>
          <select
            value={form.goldInterestPaymentType}
            onChange={(event) =>
              onChange(
                "goldInterestPaymentType",
                event.target.value === "yearly" ? "yearly" : "monthly"
              )
            }
            className={cn(
              "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition focus:border-primary",
              radius.input
            )}
          >
            <option value="monthly">Monthly interest</option>
            <option value="yearly">Yearly interest</option>
          </select>
        </label>

        <div className={cn("space-y-1 bg-white/45 px-4 py-3", radius.inner)}>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Monthly interest burden
          </span>
          <p className="text-lg font-semibold tracking-tight">
            {formatInr(Math.round(monthlyInterestBurden))}
          </p>
          <span className="block text-xs leading-5 text-muted-foreground">
            Calculated automatically from outstanding principal and rate.
          </span>
        </div>
      </FormSection>

      <FormSection title="Optional">
        <Field
          label="Gold weight (grams)"
          value={form.goldWeightGrams}
          onChange={(value) => onChange("goldWeightGrams", value)}
          inputMode="decimal"
          helperText="Optional. Not used in any calculation."
        />
      </FormSection>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
  helperText?: string;
  readOnly?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  helperText,
  readOnly = false
}: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
          readOnly && "text-muted-foreground",
          radius.input
        )}
      />
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}
