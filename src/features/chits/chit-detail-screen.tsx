"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArchiveLoanDialog } from "@/components/ui/archive-loan-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { SaveSuccessBanner } from "@/components/ui/save-success-banner";
import { useFinanceDataReload } from "@/hooks/use-finance-data-reload";
import { getChitProviderDisplay, getPrizeStatusLabel } from "@/lib/chit-display";
import { getChitStatus, isActiveChit, isArchivedChit } from "@/lib/chit-status";
import { card, spacing } from "@/lib/design-tokens";
import { cn, formatInr } from "@/lib/utils";
import { financeRepository } from "@/repositories";
import {
  archiveChitRecord,
  softDeleteChitRecord
} from "@/services/chit-management/chit-lifecycle";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import type { Chit } from "@/shared/domain/chit";

interface ChitDetailScreenProps {
  chitId: string;
}

export function ChitDetailScreen({ chitId }: ChitDetailScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chit, setChit] = useState<Chit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const showSavedBanner = searchParams.get("saved") === "1";

  const loadChit = useCallback(async () => {
    const [profile, localChit] = await Promise.all([
      financeRepository.getProfile(),
      financeRepository.getChit(chitId)
    ]);

    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    if (!localChit || getChitStatus(localChit) === "deleted") {
      setChit(null);
      setIsLoading(false);
      return;
    }

    setChit(localChit);
    setIsLoading(false);
  }, [chitId, router]);

  useEffect(() => {
    setIsLoading(true);
    void loadChit();
  }, [loadChit]);

  useFinanceDataReload(() => {
    void loadChit();
  });

  async function confirmDeleteChit() {
    if (!chit) {
      return;
    }

    setIsDeleting(true);
    setIsFadingOut(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 220);
    });

    await softDeleteChitRecord(financeRepository, chit.id);
    router.replace("/chits");
  }

  async function confirmArchiveChit(archiveReason?: string) {
    if (!chit) {
      return;
    }

    setIsArchiving(true);
    setIsFadingOut(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 220);
    });

    await archiveChitRecord(financeRepository, chit.id, archiveReason);
    router.replace("/chits?view=archived");
  }

  if (isLoading) {
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

  if (!chit) {
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
          <Card>
            <h1 className="font-display text-3xl tracking-[-0.04em]">Chit not found.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This chit may have been removed.
            </p>
          </Card>
        </header>
      </div>
    );
  }

  const metrics = deriveChitMetrics(chit);
  const isArchived = isArchivedChit(chit);
  const isActive = isActiveChit(chit);

  return (
    <div
      className={cn(
        spacing.page,
        "transition-opacity duration-200",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
    >
      <SaveSuccessBanner show={showSavedBanner} message="Chit saved." />

      <header className="space-y-4 pt-4">
        <Link
          href="/chits"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Chits
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {getChitProviderDisplay(chit)}
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.04em]">
              {chit.chitName}
            </h1>
            {isArchived ? (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Archived
              </span>
            ) : null}
          </div>

          {isActive ? (
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm" className="gap-1">
                <Link href={`/chits/${chit.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      {isActive && metrics.shouldSuggestArchive ? (
        <Card className="space-y-3 bg-primary text-primary-foreground">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-60">
              Chit complete
            </p>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.04em]">
              Ready to archive this chit?
            </h2>
            <p className="text-sm leading-6 opacity-70">
              All months are complete. Archive to keep it for reference without active
              commitments.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setShowArchiveDialog(true)}
          >
            Archive chit
          </Button>
        </Card>
      ) : null}

      <Card className={cn("space-y-4", card.paddingCompact)}>
        <MetricCardGrid>
          <MetricCard label="Current month" value={`Month ${chit.currentRunningMonth}`} />
          <MetricCard
            label="Monthly contribution"
            value={formatInr(chit.monthlyContribution)}
          />
          <MetricCard label="Prize status" value={getPrizeStatusLabel(chit)} valueKind="text" />
          <MetricCard label="Remaining months" value={`${metrics.remainingMonths} mo`} />
          <MetricCard label="Next due date" value={formatDueDate(chit.nextDueDate)} />
          <MetricCard label="Chit value" value={formatInr(chit.chitValue)} />
        </MetricCardGrid>
      </Card>

      <Card className={cn("space-y-3", card.paddingCompact)}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Remaining participation
        </p>
        <MetricCardGrid>
          <MetricCard
            label="Remaining contributions"
            value={String(metrics.remainingContributions)}
          />
          <MetricCard
            label="Total remaining"
            value={formatInr(metrics.totalRemainingContribution)}
          />
          {chit.prizeReceived ? (
            <MetricCard
              label="Remaining installments"
              value={String(metrics.remainingInstallments)}
            />
          ) : (
            <MetricCard
              label="Expected participation"
              value={formatInr(metrics.expectedRemainingParticipation)}
            />
          )}
        </MetricCardGrid>
      </Card>

      {chit.prizeReceived ? (
        <Card className={cn("space-y-3", card.paddingCompact)}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Prize details
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Auction month</p>
              <p className="font-semibold">Month {chit.auctionMonth}</p>
            </div>
            {chit.prizeAmountReceived !== undefined ? (
              <div>
                <p className="text-xs text-muted-foreground">Prize received</p>
                <p className="font-semibold">{formatInr(chit.prizeAmountReceived)}</p>
              </div>
            ) : null}
            {chit.winningDiscount !== undefined ? (
              <div>
                <p className="text-xs text-muted-foreground">Winning discount</p>
                <p className="font-semibold">{formatInr(chit.winningDiscount)}</p>
              </div>
            ) : null}
          </div>
          {chit.prizeNotes ? (
            <p className="text-sm leading-6 text-muted-foreground">{chit.prizeNotes}</p>
          ) : null}
        </Card>
      ) : null}

      {chit.providerType === "local" && chit.customRules ? (
        <Card className={cn("space-y-3", card.paddingCompact)}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Custom rules
          </p>
          <div className="space-y-2 text-sm">
            <RuleRow label="Winner selection" value={formatWinnerSelection(chit.customRules.winnerSelection)} />
            <RuleRow
              label="Discount sharing"
              value={formatDiscountDistribution(chit.customRules.discountDistribution)}
            />
            <RuleRow
              label="Payment changes after auction"
              value={formatYesNoUnknown(chit.customRules.paymentChangesAfterAuction)}
            />
            <RuleRow
              label="Organizer commission"
              value={formatCommission(chit.customRules)}
            />
          </div>
        </Card>
      ) : null}

      {isArchived && chit.archiveReason ? (
        <Card className={cn("space-y-2", card.paddingCompact)}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Archive reason
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{chit.archiveReason}</p>
        </Card>
      ) : null}

      {isActive ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setShowArchiveDialog(true)}>
            Archive
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteDialog(true)}>
            Delete
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete chit?"
        description="This removes the chit from your active list. You can add it again later if needed."
        confirmLabel="Delete"
        isWorking={isDeleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void confirmDeleteChit()}
      />

      <ArchiveLoanDialog
        open={showArchiveDialog}
        isWorking={isArchiving}
        title="Archive chit?"
        description="This chit will move to your archived list. All details will be preserved for reference."
        reasonPlaceholder="Chit completed"
        onCancel={() => setShowArchiveDialog(false)}
        onConfirm={(archiveReason) => void confirmArchiveChit(archiveReason)}
      />
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-b-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-right font-medium">{value}</p>
    </div>
  );
}

function formatWinnerSelection(value: string) {
  switch (value) {
    case "open-auction":
      return "Open Auction";
    case "lottery":
      return "Lottery";
    case "fixed-rotation":
      return "Fixed Rotation";
    default:
      return "Unknown";
  }
}

function formatDiscountDistribution(value: string) {
  switch (value) {
    case "shared-everyone":
      return "Shared among everyone";
    case "shared-non-winners":
      return "Shared among non-winners";
    default:
      return "Unknown";
  }
}

function formatYesNoUnknown(value: string) {
  switch (value) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    default:
      return "Unknown";
  }
}

function formatCommission(rules: NonNullable<Chit["customRules"]>) {
  if (rules.organizerCommission !== "yes") {
    return formatYesNoUnknown(rules.organizerCommission);
  }

  if (rules.commissionMode === "percentage" && rules.commissionPercentage !== undefined) {
    return `${rules.commissionPercentage}%`;
  }

  if (rules.commissionMode === "fixed" && rules.commissionFixedAmount !== undefined) {
    return formatInr(rules.commissionFixedAmount);
  }

  return "Yes";
}

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}
