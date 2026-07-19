"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppEvent, ScreenName, trackApplicationEvent, trackScreenViewed } from "@/core/analytics";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { card, radius, spacing } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { financeRepository } from "@/repositories";
import {
  getProductDetailHref,
  syncProductGeneratedCommitments
} from "@/services/commitment-sync/sync-product-commitments";
import { syncManualCommitmentsToMoneyBreakdown } from "@/services/commitment-sync/sync-manual-to-money";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind,
  type CommitmentCategoryValue,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

type ManualFormState = {
  title: string;
  amount: string;
  category: CommitmentCategoryValue;
  nextDueDate: string;
};

const emptyManualForm: ManualFormState = {
  title: "",
  amount: "",
  category: CommitmentCategory.RENT,
  nextDueDate: ""
};

const MANUAL_CATEGORIES: Array<{ value: CommitmentCategoryValue; label: string }> = [
  { value: CommitmentCategory.RENT, label: "Rent" },
  { value: CommitmentCategory.UTILITY, label: "Utility" },
  { value: CommitmentCategory.SUBSCRIPTION, label: "Subscription" },
  { value: CommitmentCategory.MANUAL_EXPENSE, label: "Manual expense" },
  { value: CommitmentCategory.SCHOOL_FEES, label: "School fees" },
  { value: CommitmentCategory.TAX, label: "Tax" },
  { value: CommitmentCategory.INSURANCE_PREMIUM, label: "Insurance" },
  { value: CommitmentCategory.OTHER, label: "Other" }
];

function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceLabel(commitment: CommitmentRecord) {
  if (commitment.source.kind === CommitmentSourceKind.PRODUCT_GENERATED) {
    return "From product";
  }

  if (commitment.source.kind === CommitmentSourceKind.LEGACY_MIGRATED) {
    return "Needs review";
  }

  return "Manual";
}

export function CommitmentsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [commitments, setCommitments] = useState<CommitmentRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualForm, setManualForm] = useState<ManualFormState>(emptyManualForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasTrackedScreenView = useRef(false);

  const loadCommitments = useCallback(async () => {
    const profile = await financeRepository.getProfile();

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    await syncProductGeneratedCommitments(financeRepository);
    const records = await financeRepository.listCommitments();
    setCommitments(
      [...records].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate) || a.title.localeCompare(b.title))
    );
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadCommitments();
  }, [loadCommitments]);

  useEffect(() => {
    if (!isLoading && !hasTrackedScreenView.current) {
      hasTrackedScreenView.current = true;
      trackScreenViewed(ScreenName.COMMITMENTS);
    }
  }, [isLoading]);

  useFinanceDataReload(() => {
    void loadCommitments();
  });

  const needsReview = useMemo(
    () =>
      commitments.filter(
        (item) =>
          item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW ||
          item.source.kind === CommitmentSourceKind.LEGACY_MIGRATED
      ),
    [commitments]
  );

  const productGenerated = useMemo(
    () =>
      commitments.filter(
        (item) =>
          item.source.kind === CommitmentSourceKind.PRODUCT_GENERATED &&
          item.reviewStatus !== CommitmentReviewStatus.NEEDS_REVIEW
      ),
    [commitments]
  );

  const manual = useMemo(
    () =>
      commitments.filter(
        (item) =>
          item.source.kind === CommitmentSourceKind.MANUAL &&
          item.reviewStatus === CommitmentReviewStatus.CONFIRMED
      ),
    [commitments]
  );

  async function persistAndReload() {
    await syncManualCommitmentsToMoneyBreakdown(financeRepository);
    notifyFinanceDataUpdated("money");
    await loadCommitments();
  }

  async function confirmLegacyCommitment(commitment: CommitmentRecord) {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await financeRepository.saveCommitment({
        ...commitment,
        source: {
          ...commitment.source,
          kind: CommitmentSourceKind.MANUAL
        },
        reviewStatus: CommitmentReviewStatus.CONFIRMED,
        editable: true,
        updatedAt: now
      });
      trackApplicationEvent(AppEvent.LEGACY_COMMITMENT_REVIEWED, {
        commitment_id: commitment.id
      });
      await persistAndReload();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCommitment(id: string) {
    setIsSaving(true);
    try {
      await financeRepository.deleteCommitment(id);
      await persistAndReload();
    } finally {
      setIsSaving(false);
    }
  }

  async function saveManualCommitment() {
    const amount = toNumber(manualForm.amount);
    const title = manualForm.title.trim();
    if (!title || amount <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const id = editingId ?? `manual-${crypto.randomUUID()}`;
      const existing = editingId ? await financeRepository.getCommitment(editingId) : null;

      const record: CommitmentRecord = {
        id,
        title,
        category: manualForm.category,
        amount,
        frequency: CommitmentFrequency.MONTHLY,
        nextDueDate: manualForm.nextDueDate || firstDayOfNextMonth(now),
        priority: CommitmentPriority.MEDIUM,
        source: { kind: CommitmentSourceKind.MANUAL },
        reviewStatus: CommitmentReviewStatus.CONFIRMED,
        reminderEnabled: false,
        editable: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      await financeRepository.saveCommitment(record);

      if (!editingId) {
        trackApplicationEvent(AppEvent.COMMITMENT_CREATED, { commitment_id: record.id });
      }

      setManualForm(emptyManualForm);
      setEditingId(null);
      setShowAddForm(false);
      await persistAndReload();
    } finally {
      setIsSaving(false);
    }
  }

  function beginEdit(commitment: CommitmentRecord) {
    if (!commitment.editable && commitment.source.kind === CommitmentSourceKind.PRODUCT_GENERATED) {
      return;
    }

    setEditingId(commitment.id);
    setManualForm({
      title: commitment.title,
      amount: String(commitment.amount),
      category: commitment.category,
      nextDueDate: commitment.nextDueDate
    });
    setShowAddForm(true);
  }

  if (isLoading) {
    return (
      <div className={spacing.page}>
        <header className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
            Reading your commitments.
          </h1>
        </header>
      </div>
    );
  }

  return (
    <div className={spacing.page}>
      <header className="space-y-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Commitments
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
          What must you pay next?
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Product obligations are read-only here. Edit the parent product instead. Manual
          commitments stay editable.
        </p>
      </header>

      {needsReview.length > 0 ? (
        <section className={spacing.section}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Needs review
          </p>
          <div className={cn("flex flex-col", spacing.cardStack)}>
            {needsReview.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                actions={
                  <>
                    <Button
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void confirmLegacyCommitment(commitment)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isSaving}
                      onClick={() => beginEdit(commitment)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => void deleteCommitment(commitment.id)}
                    >
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={spacing.section}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          From products
        </p>
        {productGenerated.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No product-generated commitments yet. Add a loan or chit under Products.
          </p>
        ) : (
          <div className={cn("flex flex-col", spacing.cardStack)}>
            {productGenerated.map((commitment) => {
              const href = getProductDetailHref(commitment);
              return (
                <CommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  actions={
                    href ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href={href}>Open product</Link>
                      </Button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <section className={spacing.section}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Manual
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() => {
              setEditingId(null);
              setManualForm(emptyManualForm);
              setShowAddForm((value) => !value);
            }}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {showAddForm ? (
          <Card className={cn("space-y-4", card.paddingCompact)}>
            <Field
              label="Title"
              value={manualForm.title}
              onChange={(value) => setManualForm((current) => ({ ...current, title: value }))}
              placeholder="Rent"
            />
            <Field
              label="Amount"
              value={manualForm.amount}
              onChange={(value) => setManualForm((current) => ({ ...current, amount: value }))}
              placeholder="18000"
              inputMode="numeric"
            />
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Category
              </span>
              <select
                value={manualForm.category}
                onChange={(event) =>
                  setManualForm((current) => ({
                    ...current,
                    category: event.target.value as CommitmentCategoryValue
                  }))
                }
                className={cn(
                  "h-12 w-full border border-border bg-white/45 px-4 text-base outline-none",
                  radius.input
                )}
              >
                {MANUAL_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Next due date"
              value={manualForm.nextDueDate}
              onChange={(value) =>
                setManualForm((current) => ({ ...current, nextDueDate: value }))
              }
              type="date"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setManualForm(emptyManualForm);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" disabled={isSaving} onClick={() => void saveManualCommitment()}>
                {editingId ? "Save changes" : "Save commitment"}
              </Button>
            </div>
          </Card>
        ) : null}

        {manual.length === 0 && !showAddForm ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No manual commitments yet. Add rent, utilities, or other recurring obligations.
          </p>
        ) : (
          <div className={cn("flex flex-col", spacing.cardStack)}>
            {manual.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isSaving}
                      onClick={() => beginEdit(commitment)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => void deleteCommitment(commitment.id)}
                    >
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CommitmentCard({
  commitment,
  actions
}: {
  commitment: CommitmentRecord;
  actions?: ReactNode;
}) {
  return (
    <Card className={cn("space-y-3", card.paddingCompact)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {sourceLabel(commitment)} · {commitment.frequency}
          </p>
          <h2 className="font-semibold">{commitment.title}</h2>
          <p className="text-sm text-muted-foreground">Due {commitment.nextDueDate}</p>
          {commitment.notes ? (
            <p className="text-xs leading-5 text-muted-foreground">{commitment.notes}</p>
          ) : null}
        </div>
        <p className="shrink-0 font-semibold">{formatInr(commitment.amount)}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
}) {
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

function firstDayOfNextMonth(isoNow: string): string {
  const date = new Date(isoNow);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}
