"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { radius, spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { toNumber } from "@/shared/finance/loan-form";
import type { UserProfile } from "@/shared/domain/finance";

const currencyOptions = [{ value: "INR", label: "INR ₹" }] as const;

interface ProfileFormState {
  displayName: string;
  monthlyIncome: string;
  emergencyBuffer: string;
  currency: string;
}

export function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const [localProfile, moneyBreakdown] = await Promise.all([
        indexedDbFinanceRepository.getProfile(),
        indexedDbFinanceRepository.getMoneyBreakdown()
      ]);

      if (!isMounted) {
        return;
      }

      if (!localProfile?.onboardingCompleted || !moneyBreakdown) {
        router.replace("/onboarding");
        return;
      }

      setProfile(localProfile);
      setForm({
        displayName: localProfile.displayName,
        monthlyIncome: String(moneyBreakdown.monthlyIncome),
        emergencyBuffer: String(moneyBreakdown.emergencyBuffer),
        currency: localProfile.currency ?? "INR"
      });
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateField<Key extends keyof ProfileFormState>(
    field: Key,
    value: ProfileFormState[Key]
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors([]);
  }

  async function saveProfile() {
    if (!form || !profile) {
      return;
    }

    const validationErrors = validateProfileForm(form);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    const moneyBreakdown = await indexedDbFinanceRepository.getMoneyBreakdown();

    if (moneyBreakdown) {
      await indexedDbFinanceRepository.saveMoneyBreakdown({
        ...moneyBreakdown,
        monthlyIncome: toNumber(form.monthlyIncome),
        emergencyBuffer: toNumber(form.emergencyBuffer)
      });
    }

    await indexedDbFinanceRepository.saveProfile({
      ...profile,
      displayName: form.displayName.trim(),
      currency: form.currency,
      updatedAt: new Date().toISOString()
    });

    notifyFinanceDataUpdated("profile");
    router.replace("/profile?saved=1");
  }

  if (!form) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading profile.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Profile
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Edit profile
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Your details
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Changes update your greeting and financial snapshot immediately.
          </p>
        </div>
      </header>

      <Card className="space-y-5">
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

        <Field
          label="Name"
          value={form.displayName}
          onChange={(value) => updateField("displayName", value)}
          placeholder="Arjun"
        />
        <Field
          label="Monthly salary"
          value={form.monthlyIncome}
          onChange={(value) => updateField("monthlyIncome", value)}
          inputMode="numeric"
        />
        <Field
          label="Emergency buffer"
          value={form.emergencyBuffer}
          onChange={(value) => updateField("emergencyBuffer", value)}
          inputMode="numeric"
        />

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Currency
          </span>
          <select
            value={form.currency}
            onChange={(event) => updateField("currency", event.target.value)}
            className={cn(
              "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none focus:border-primary",
              radius.input
            )}
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="block text-xs leading-5 text-muted-foreground">
            More currencies are planned for future releases.
          </span>
        </label>

        <div className={cn("space-y-2 bg-white/45 px-4 py-4", radius.inner)}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Profile picture
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Photo upload is planned for a future release.
          </p>
        </div>
      </Card>

      <Button className="w-full gap-2" disabled={isSaving} onClick={() => void saveProfile()}>
        Save profile
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

function validateProfileForm(form: ProfileFormState) {
  const errors: string[] = [];

  if (!form.displayName.trim()) {
    errors.push("Name is required.");
  }

  if (toNumber(form.monthlyIncome) <= 0) {
    errors.push("Monthly salary must be greater than 0.");
  }

  if (toNumber(form.emergencyBuffer) < 0) {
    errors.push("Emergency buffer cannot be negative.");
  }

  return errors;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric";
}

function Field({ label, value, onChange, placeholder, inputMode }: FieldProps) {
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
        className={cn(
          "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none transition placeholder:text-muted-foreground/55 focus:border-primary",
          radius.input
        )}
      />
    </label>
  );
}
