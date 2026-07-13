"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChitFormFields } from "@/features/chits/chit-form-fields";
import { AppEvent, trackApplicationEvent } from "@/core/analytics";
import { spacing } from "@/lib/design-tokens";
import { isActiveChit } from "@/lib/chit-status";
import { financeRepository } from "@/repositories";
import { saveChitUpdate } from "@/services/chit-management/chit-lifecycle";
import {
  buildChitFromForm,
  chitToFormState,
  validateChitForm
} from "@/shared/finance/chit-form";
import type { ChitFormState } from "@/shared/finance/chit-form";
import type { Chit } from "@/shared/domain/chit";

interface EditChitScreenProps {
  chitId: string;
}

export function EditChitScreen({ chitId }: EditChitScreenProps) {
  const router = useRouter();
  const [existingChit, setExistingChit] = useState<Chit | null>(null);
  const [form, setForm] = useState<ChitFormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadChit() {
      const [profile, chit] = await Promise.all([
        financeRepository.getProfile(),
        financeRepository.getChit(chitId)
      ]);

      if (!isMounted) {
        return;
      }

      if (!profile?.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }

      if (!chit || !isActiveChit(chit)) {
        router.replace("/chits");
        return;
      }

      setExistingChit(chit);
      setForm(chitToFormState(chit));
    }

    void loadChit();

    return () => {
      isMounted = false;
    };
  }, [chitId, router]);

  function updateField<Key extends keyof ChitFormState>(field: Key, value: ChitFormState[Key]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors([]);
  }

  async function saveChit() {
    if (!form || !existingChit) {
      return;
    }

    const validationErrors = validateChitForm(form);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const chit = buildChitFromForm(form, existingChit);
    await saveChitUpdate(financeRepository, existingChit, chit);
    trackApplicationEvent(AppEvent.CHIT_UPDATED, { chit_id: chitId });
    router.replace(`/chits/${chitId}?saved=1`);
  }

  if (!form) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading your chit.
          </h1>
        </header>
      </div>
    );
  }

  const canSave =
    form.chitName.trim().length > 0 &&
    form.providerName.trim().length > 0 &&
    validateChitForm(form).length === 0;

  return (
    <div className={spacing.page}>
      <header className="space-y-4 pt-4">
        <Link
          href={`/chits/${chitId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Chit details
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Edit chit
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            {existingChit?.chitName ?? "Update chit"}
          </h1>
        </div>
      </header>

      <Card>
        <ChitFormFields form={form} errors={errors} onChange={updateField} />
      </Card>

      <Button className="w-full gap-2" disabled={!canSave || isSaving} onClick={() => void saveChit()}>
        Save changes
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
