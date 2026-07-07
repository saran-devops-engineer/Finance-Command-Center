"use client";

import type { ReactNode } from "react";
import { radius } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { HomeLoanFormState } from "@/shared/finance/home-loan-form";

interface HomeLoanFormFieldsProps {
  form: HomeLoanFormState;
  errors: string[];
  onChange: <Key extends keyof HomeLoanFormState>(
    field: Key,
    value: HomeLoanFormState[Key]
  ) => void;
}

export function HomeLoanFormFields({ form, errors, onChange }: HomeLoanFormFieldsProps) {
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
          placeholder="Plot Loan"
        />
        <Field label="Loan type" value="Home Loan" readOnly />
        <Field
          label="Lender name"
          value={form.lender}
          onChange={(value) => onChange("lender", value)}
          placeholder="HDFC Bank"
        />
      </FormSection>

      <FormSection title="Original loan">
        <Field
          label="Original loan amount"
          value={form.originalAmount}
          onChange={(value) => onChange("originalAmount", value)}
          inputMode="numeric"
        />
        <Field
          label="Loan start date"
          value={form.loanStartDate}
          onChange={(value) => onChange("loanStartDate", value)}
          type="date"
        />
        <Field
          label="Original loan tenure"
          value={form.originalLoanTenureMonths}
          onChange={(value) => onChange("originalLoanTenureMonths", value)}
          inputMode="numeric"
          helperText="Total tenure in months when the loan started."
        />
        <Field
          label="Interest rate"
          value={form.annualInterestRate}
          onChange={(value) => onChange("annualInterestRate", value)}
          inputMode="decimal"
          helperText="Annual rate in percent."
        />
      </FormSection>

      <FormSection title="Current snapshot">
        <Field
          label="Current outstanding principal"
          value={form.outstandingBalance}
          onChange={(value) => onChange("outstandingBalance", value)}
          inputMode="numeric"
        />
        <Field
          label="Current EMI"
          value={form.monthlyEmi}
          onChange={(value) => onChange("monthlyEmi", value)}
          inputMode="numeric"
        />
        <Field
          label="Remaining tenure"
          value={form.remainingTenureMonths}
          onChange={(value) => {
            onChange("remainingTenureMonths", value);
            onChange("remainingTenureManuallyOverridden", true);
          }}
          inputMode="numeric"
          helperText="Months left. Edit if part-payments already reduced your tenure."
        />
      </FormSection>

      <FormSection title="Payment">
        <Field
          label="EMI payment day"
          value={form.emiPaymentDay}
          onChange={(value) => onChange("emiPaymentDay", value)}
          inputMode="numeric"
          helperText="Day of the month (1–31)."
        />
      </FormSection>
    </div>
  );
}

function FormSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
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
