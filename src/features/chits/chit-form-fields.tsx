"use client";

import type { ReactNode } from "react";
import { radius } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import {
  REGISTERED_CHIT_PROVIDER_OPTIONS,
  getRegisteredProviderLabel
} from "@/lib/chit-display";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import type { ChitFormState } from "@/shared/finance/chit-form";
import { registeredProviderToName, toNumber } from "@/shared/finance/chit-form";

interface ChitFormFieldsProps {
  form: ChitFormState;
  errors: string[];
  onChange: <Key extends keyof ChitFormState>(field: Key, value: ChitFormState[Key]) => void;
}

export function ChitFormFields({ form, errors, onChange }: ChitFormFieldsProps) {
  const metrics = deriveChitMetrics({
    totalDurationMonths: toNumber(form.totalDurationMonths),
    currentRunningMonth: toNumber(form.currentRunningMonth),
    monthlyContribution: toNumber(form.monthlyContribution),
    prizeReceived: form.prizeReceived === "yes",
    startDate: form.startDate
  });

  function handleProviderTypeChange(value: ChitFormState["providerType"]) {
    onChange("providerType", value);

    if (value === "registered") {
      onChange("providerName", registeredProviderToName(form.registeredProvider));
    }
  }

  function handleRegisteredProviderChange(provider: ChitFormState["registeredProvider"]) {
    onChange("registeredProvider", provider);

    if (provider !== "other-registered") {
      onChange("providerName", getRegisteredProviderLabel(provider));
    }
  }

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

      <FormSection title="Basic information">
        <RadioGroup
          label="Provider type"
          value={form.providerType}
          options={[
            { value: "registered", label: "Registered Chit Company" },
            { value: "local", label: "Local Committee / Custom" }
          ]}
          onChange={(value) =>
            handleProviderTypeChange(value as ChitFormState["providerType"])
          }
        />

        {form.providerType === "registered" ? (
          <SelectField
            label="Registered provider"
            value={form.registeredProvider}
            onChange={(value) =>
              handleRegisteredProviderChange(value as ChitFormState["registeredProvider"])
            }
            options={REGISTERED_CHIT_PROVIDER_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label
            }))}
          />
        ) : null}

        {form.providerType === "local" ||
        form.registeredProvider === "other-registered" ? (
          <Field
            label="Provider name"
            value={form.providerName}
            onChange={(value) => onChange("providerName", value)}
            placeholder={
              form.providerType === "local" ? "Neighborhood committee name" : "Company name"
            }
            helperText={
              form.providerType === "local"
                ? "Enter the name of your local chit organizer or committee."
                : undefined
            }
          />
        ) : null}

        <Field
          label="Chit name"
          value={form.chitName}
          onChange={(value) => onChange("chitName", value)}
          placeholder="Family chit fund"
          helperText="A name you will recognize on your dashboard."
        />
        <Field
          label="Chit value"
          value={form.chitValue}
          onChange={(value) => onChange("chitValue", value)}
          inputMode="numeric"
          helperText="Total chit pool value when the group started."
        />
        <Field
          label="Monthly contribution"
          value={form.monthlyContribution}
          onChange={(value) => onChange("monthlyContribution", value)}
          inputMode="numeric"
          helperText="What you pay each month toward this chit."
        />
        <Field
          label="Total duration (months)"
          value={form.totalDurationMonths}
          onChange={(value) => onChange("totalDurationMonths", value)}
          inputMode="numeric"
          placeholder="20"
          helperText="Example: 20, 30, or 40 months."
        />
        <Field
          label="Start date"
          value={form.startDate}
          onChange={(value) => onChange("startDate", value)}
          type="date"
        />
      </FormSection>

      <FormSection title="Current status">
        <Field
          label="Current running month"
          value={form.currentRunningMonth}
          onChange={(value) => onChange("currentRunningMonth", value)}
          inputMode="numeric"
          placeholder="5"
          helperText="Which month is the chit in right now? Example: Month 5."
        />
        <RadioGroup
          label="Have you already received the chit?"
          value={form.prizeReceived}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" }
          ]}
          onChange={(value) => onChange("prizeReceived", value as "yes" | "no")}
        />
      </FormSection>

      {form.prizeReceived === "yes" ? (
        <FormSection title="Prize received">
          <Field
            label="Auction month"
            value={form.auctionMonth}
            onChange={(value) => onChange("auctionMonth", value)}
            inputMode="numeric"
            helperText="The month when you won the chit auction."
          />
          <Field
            label="Prize amount received"
            value={form.prizeAmountReceived}
            onChange={(value) => onChange("prizeAmountReceived", value)}
            inputMode="numeric"
            helperText="Optional. Amount you received after the auction."
          />
          <Field
            label="Winning discount"
            value={form.winningDiscount}
            onChange={(value) => onChange("winningDiscount", value)}
            inputMode="numeric"
            helperText="Optional. Discount bid at the auction, if you know it."
          />
          <Field
            label="Notes"
            value={form.prizeNotes}
            onChange={(value) => onChange("prizeNotes", value)}
            placeholder="Any details about the auction"
          />
        </FormSection>
      ) : null}

      {form.providerType === "local" ? (
        <FormSection title="Custom chit rules">
          <p className="text-sm leading-6 text-muted-foreground">
            Answer what you know. These help us track your chit correctly.
          </p>
          <RadioGroup
            label="How is the winner selected?"
            value={form.winnerSelection}
            options={[
              { value: "open-auction", label: "Open Auction" },
              { value: "lottery", label: "Lottery" },
              { value: "fixed-rotation", label: "Fixed Rotation" },
              { value: "unknown", label: "I don't know" }
            ]}
            onChange={(value) =>
              onChange("winnerSelection", value as ChitFormState["winnerSelection"])
            }
          />
          <RadioGroup
            label="After each auction, what happens to the discount?"
            value={form.discountDistribution}
            options={[
              { value: "shared-everyone", label: "Shared among everyone" },
              {
                value: "shared-non-winners",
                label: "Shared only among members who haven't received the chit"
              },
              { value: "unknown", label: "I don't know" }
            ]}
            onChange={(value) =>
              onChange("discountDistribution", value as ChitFormState["discountDistribution"])
            }
          />
          <RadioGroup
            label="Does your monthly payment change after each auction?"
            value={form.paymentChangesAfterAuction}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "I don't know" }
            ]}
            onChange={(value) =>
              onChange(
                "paymentChangesAfterAuction",
                value as ChitFormState["paymentChangesAfterAuction"]
              )
            }
          />
          <RadioGroup
            label="Does the organizer deduct a commission?"
            value={form.organizerCommission}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "I don't know" }
            ]}
            onChange={(value) =>
              onChange("organizerCommission", value as ChitFormState["organizerCommission"])
            }
          />
          {form.organizerCommission === "yes" ? (
            <>
              <RadioGroup
                label="Commission type"
                value={form.commissionInputType}
                options={[
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed", label: "Fixed amount" }
                ]}
                onChange={(value) =>
                  onChange("commissionInputType", value as "percentage" | "fixed")
                }
              />
              {form.commissionInputType === "percentage" ? (
                <Field
                  label="Commission percentage"
                  value={form.commissionPercentage}
                  onChange={(value) => onChange("commissionPercentage", value)}
                  inputMode="decimal"
                />
              ) : (
                <Field
                  label="Commission amount"
                  value={form.commissionFixedAmount}
                  onChange={(value) => onChange("commissionFixedAmount", value)}
                  inputMode="numeric"
                />
              )}
            </>
          ) : null}
        </FormSection>
      ) : null}

      <FormSection title="Calculated for you">
        <MetricRow label="Remaining months" value={String(metrics.remainingMonths)} />
        <MetricRow label="Remaining contributions" value={String(metrics.remainingContributions)} />
        <MetricRow
          label="Total remaining contribution"
          value={formatInr(metrics.totalRemainingContribution)}
        />
        {form.prizeReceived === "no" ? (
          <MetricRow
            label="Expected remaining participation"
            value={formatInr(metrics.expectedRemainingParticipation)}
          />
        ) : (
          <MetricRow
            label="Remaining installments"
            value={String(metrics.remainingInstallments)}
          />
        )}
      </FormSection>

      <FormSection title="Optional">
        <Field
          label="Notes"
          value={form.notes}
          onChange={(value) => onChange("notes", value)}
          placeholder="Anything else to remember"
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
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
          radius.input
        )}
      />
      {helperText ? (
        <span className="block text-xs leading-5 text-muted-foreground">{helperText}</span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none focus:border-primary",
          radius.input
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-3 border border-border bg-white/45 px-4",
              radius.input,
              value === option.value && "border-primary"
            )}
          >
            <input
              type="radio"
              name={label}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
