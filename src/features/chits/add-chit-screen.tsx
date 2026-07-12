"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChitFormFields } from "@/features/chits/chit-form-fields";
import { spacing } from "@/lib/design-tokens";
import { financeRepository } from "@/repositories";
import { saveChitUpdate } from "@/services/chit-management/chit-lifecycle";
import {
  buildChitFromForm,
  initialChitFormState,
  validateChitForm
} from "@/shared/finance/chit-form";
import type { ChitFormState } from "@/shared/finance/chit-form";

export function AddChitScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ChitFormState>(initialChitFormState);
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

  function updateField<Key extends keyof ChitFormState>(field: Key, value: ChitFormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors([]);
  }

  async function saveChit() {
    const validationErrors = validateChitForm(form);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const chit = buildChitFromForm(form);
    await saveChitUpdate(financeRepository, null, chit);
    router.replace("/chits");
  }

  const canSave =
    form.chitName.trim().length > 0 &&
    form.providerName.trim().length > 0 &&
    validateChitForm(form).length === 0;

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href="/chits"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Chits
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            New chit
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Add a chit
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Track your chit fund with simple questions — no financial jargon.
          </p>
        </div>
      </header>

      <Card>
        <ChitFormFields form={form} errors={errors} onChange={updateField} />
      </Card>

      <Button className="w-full gap-2" disabled={!canSave || isSaving} onClick={() => void saveChit()}>
        Save chit
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
